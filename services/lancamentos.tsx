import { supabase } from "@/lib/supabase"
import { addDays, format } from "date-fns"

export async function getLancamentos() {
    const { data, error } = await supabase
        .from("lancamentos")
        .select()
    if (error) throw error
    return data
}


export async function getLancamentosFilter({
    idsContas,
    mes,
    ano,
    ignorarCartao = true,
    userEmail
}: {
    idsContas?: number[]
    mes?: number | null
    ano?: number | null
    ignorarCartao?: boolean
    userEmail?: string
}) {
    let email = userEmail

    if (!email) {
        const { data: { user } } = await supabase.auth.getUser()
        email = user?.email
    }

    let query = supabase
        .from("lancamentos")
        .select("*").eq("user", email)
    
    if (ignorarCartao) {
        query = query.is("id_cartao", null)
    }

    const temContaSelecionada = idsContas && idsContas.length > 0

    if (temContaSelecionada) {
        query = query.in("conta_id", idsContas)
    }

    if (mes && ano) {
        const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`
        const dataFim =
            mes === 12
                ? `${ano + 1}-01-01`
                : `${ano}-${String(mes + 1).padStart(2, "0")}-01`
        query = query
            .gte("data", dataInicio)
            .lt("data", dataFim)
    }

    const { data, error } = await query.order("data", { ascending: false })

    if (error) throw error

    return data
}

export async function getLancamentosComCategoria({
    mes,
    ano,
    userEmail
}: {
    mes: number
    ano: number
    userEmail?: string
}) {
    let email = userEmail

    if (!email) {
        const { data: { user } } = await supabase.auth.getUser()
        email = user?.email
    }

    const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`
    const dataFim =
        mes === 12
            ? `${ano + 1}-01-01`
            : `${ano}-${String(mes + 1).padStart(2, "0")}-01`

    const [{ data: lancamentos, error: errLanc }, { data: categorias, error: errCat }] =
        await Promise.all([
            supabase
                .from("lancamentos")
                .select("*")
                .eq("user", email)
                .gte("data", dataInicio)
                .lt("data", dataFim)
                .order("data", { ascending: false }),
            supabase
                .from("categorias")
                .select("id, nome"),
        ])

    if (errLanc) throw errLanc
    if (errCat) throw errCat

    const mapCategorias = Object.fromEntries(
        (categorias ?? []).map((c) => [c.id, c.nome])
    )

    return (lancamentos ?? []).map((l) => ({
        ...l,
        categoriaNome: mapCategorias[l.categoria_id] ?? "Sem categoria",
    }))
}

export async function createLancamento(data: {
    tipo: string
    descricao: string
    valor: number
    categoria_id: string
    conta_id?: string | null
    id_cartao?: string | null
    pago: boolean
    data: Date
    user?: string
    parcelas?: number
    recorrente?: boolean
    id_recorrencia?: number | null
}) {
    const { data: { user } } = await supabase.auth.getUser()
    let parcelas = 1
    if (data.recorrente) {
        parcelas = 60
    } else if (data.parcelas && data.parcelas > 1) {
        parcelas = data.parcelas
    }

    // gera um ID único para agrupar as parcelas (timestamp + random)
    const idAgrupamento = parcelas > 1
        ? Math.floor(Date.now() * 1000 + Math.random() * 1000)
        : null

    const registros = Array.from({ length: parcelas }, (_, i) => {
        const dataVencimento = new Date(data.data)
        dataVencimento.setMonth(dataVencimento.getMonth() + i)

        return {
            tipo: data.tipo,
            descricao: (!data.recorrente && parcelas > 1)
                ? `${data.descricao} (${i + 1}/${parcelas})`
                : data.descricao,
            valor: data.tipo === "despesa"
                ? -Math.abs(data.valor)
                : Math.abs(data.valor),
            categoria_id: data.categoria_id,
            conta_id: data.conta_id || null,
            id_cartao: data.id_cartao || null,
            pago: i === 0 ? data.pago : false,
            user: user?.email,
            data: format(dataVencimento, "yyyy-MM-dd"),
            id_parcelamento: data.recorrente ? null : idAgrupamento,
            id_recorrencia: data.recorrente ? idAgrupamento : (data.id_recorrencia || null),
        }
    })

    const { error } = await supabase.from("lancamentos").insert(registros)
    if (error) throw error
}

export async function updateLancamento(data: {
    id: number
    tipo: string
    descricao: string
    valor: number
    categoria_id: string
    conta_id?: string
    id_cartao?: string
    pago: boolean
    data: Date
}) {

    console.log("Updating lancamento with data:", data)

    const { error } = await supabase
        .from("lancamentos")
        .update({
            tipo: data.tipo,
            descricao: data.descricao,
            valor: data.tipo === "despesa"
                ? -Math.abs(data.valor)
                : Math.abs(data.valor),
            categoria_id: Number(data.categoria_id),
            conta_id: data.conta_id ? Number(data.conta_id) : null,
            id_cartao: data.id_cartao ? Number(data.id_cartao) : null,
            pago: data.pago,
            data: data.data ? new Date(data.data).toISOString() : null
        })
        .eq("id", data.id)

    if (error) throw error
}

export async function deleteLancamentoComOpcao(
    id: number,
    opcao: "apenas_este" | "este_e_proximos" | "todos",
    idParcelamento?: number | null,
    idRecorrencia?: number | null
) {
    const agrupamentoColuna = idRecorrencia ? "id_recorrencia" : "id_parcelamento"
    const idAgrupamento = idRecorrencia || idParcelamento

    if (!idAgrupamento || opcao === "apenas_este") {
        // Se for um lançamento vinculado (transferência), deletamos o par de qualquer forma
        if (idRecorrencia && !idParcelamento) {
             const { error } = await supabase
                .from("lancamentos")
                .delete()
                .eq("id_recorrencia", idRecorrencia)
            if (error) throw error
            return
        }

        const { error } = await supabase
            .from("lancamentos")
            .delete()
            .eq("id", id)
        if (error) throw error
        return
    }

    if (opcao === "todos") {
        // apaga todos do grupo de parcelamento/recorrência
        const { error } = await supabase
            .from("lancamentos")
            .delete()
            .eq(agrupamentoColuna, idAgrupamento)
        if (error) throw error
        return
    }

    if (opcao === "este_e_proximos") {
        // busca a data da parcela atual e deleta ela + os próximos
        const { data: lancamento } = await supabase
            .from("lancamentos")
            .select("data")
            .eq("id", id)
            .single()

        if (!lancamento) throw new Error("Lançamento não encontrado")

        const { error } = await supabase
            .from("lancamentos")
            .delete()
            .eq(agrupamentoColuna, idAgrupamento)
            .gte("data", lancamento.data)

        if (error) throw error
    }
}

export async function getLancamentosCartao({
    cartaoId, mes, ano, diaFechamento
}: { cartaoId: number, mes: number, ano: number, diaFechamento: number }) {
    
    // A fatura que VENCE em Junho, FECHA em Maio.
    // Então os lançamentos são de Abril (diaFechamento) até Maio (diaFechamento).
    let mesFim = mes - 1
    let anoFim = ano
    if (mesFim < 1) {
        mesFim = 12
        anoFim = ano - 1
    }

    let mesInicio = mesFim - 1
    let anoInicio = anoFim
    if (mesInicio < 1) {
        mesInicio = 12
        anoInicio = anoFim - 1
    }
    
    const dataInicio = `${anoInicio}-${String(mesInicio).padStart(2, "0")}-${String(diaFechamento).padStart(2, "0")}`
    const dataFim = `${anoFim}-${String(mesFim).padStart(2, "0")}-${String(diaFechamento).padStart(2, "0")}`

    const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .eq("id_cartao", cartaoId)
        .gte("data", dataInicio)
        .lt("data", dataFim)
        .order("data", { ascending: true })

    if (error) throw error
    return data
}

export async function pagarFaturaCartao({
    cartaoId, mes, ano, diaFechamento
}: { cartaoId: number, mes: number, ano: number, diaFechamento: number }) {
    let mesFim = mes - 1
    let anoFim = ano
    if (mesFim < 1) {
        mesFim = 12
        anoFim = ano - 1
    }

    let mesInicio = mesFim - 1
    let anoInicio = anoFim
    if (mesInicio < 1) {
        mesInicio = 12
        anoInicio = anoFim - 1
    }

    const dataInicio = `${anoInicio}-${String(mesInicio).padStart(2, "0")}-${String(diaFechamento).padStart(2, "0")}`
    const dataFim = `${anoFim}-${String(mesFim).padStart(2, "0")}-${String(diaFechamento).padStart(2, "0")}`

    const { data, error } = await supabase
        .from("lancamentos")
        .update({ pago: true })
        .eq("id_cartao", cartaoId)
        .gte("data", dataInicio)
        .lt("data", dataFim)
        .select()

    if (error) throw error
    return data
}