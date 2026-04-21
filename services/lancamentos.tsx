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
    ano
}: {
    idsContas?: number[]
    mes?: number | null
    ano?: number | null
}) {

    let query = supabase
        .from("lancamentos")
        .select("*")

    const temContaSelecionada = idsContas && idsContas.length > 0

    if (temContaSelecionada) {
        query = query.in("conta_id", idsContas)
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
    }

    const { data, error } = await query.order("data", { ascending: false })

    if (error) throw error

    return data
}

export async function getLancamentosComCategoria({
    mes,
    ano
}: {
    mes: number
    ano: number
}) {
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
    conta_id: string
    pago: boolean
    data: Date
    user?: string
    parcelas?: number
}) {
    const { data: { user } } = await supabase.auth.getUser()
    const parcelas = data.parcelas && data.parcelas > 1 ? data.parcelas : 1

    // gera um ID único para agrupar as parcelas (timestamp + random)
    const idParcelamento = parcelas > 1
        ? Math.floor(Date.now() * 1000 + Math.random() * 1000)
        : null

    const registros = Array.from({ length: parcelas }, (_, i) => {
        const dataVencimento = new Date(data.data)
        dataVencimento.setMonth(dataVencimento.getMonth() + i)

        return {
            tipo: data.tipo,
            descricao: parcelas > 1
                ? `${data.descricao} (${i + 1}/${parcelas})`
                : data.descricao,
            valor: data.tipo === "despesa"
                ? -Math.abs(data.valor)
                : Math.abs(data.valor),
            categoria_id: data.categoria_id,
            conta_id: data.conta_id,
            pago: i === 0 ? data.pago : false,
            user: user?.email,
            data: format(dataVencimento, "yyyy-MM-dd"),
            id_parcelamento: idParcelamento,
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
    conta_id: string
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
            conta_id: Number(data.conta_id),
            pago: data.pago,
            data: data.data ? new Date(data.data).toISOString() : null
        })
        .eq("id", data.id)

    if (error) throw error
}

export async function deleteLancamentoComOpcao(
    id: number,
    opcao: "apenas_este" | "este_e_proximos" | "todos",
    idParcelamento?: number | null
) {
    if (!idParcelamento || opcao === "apenas_este") {
        // sem parcelamento ou apaga só este
        const { error } = await supabase
            .from("lancamentos")
            .delete()
            .eq("id", id)
        if (error) throw error
        return
    }

    if (opcao === "todos") {
        // apaga todos do grupo de parcelamento
        const { error } = await supabase
            .from("lancamentos")
            .delete()
            .eq("id_parcelamento", idParcelamento)
        if (error) throw error
        return
    }

    if (opcao === "este_e_proximos") {
        // busca o número da parcela atual e deleta ele + os próximos
        const { data: lancamento } = await supabase
            .from("lancamentos")
            .select("descricao")
            .eq("id", id)
            .single()

        if (!lancamento) throw new Error("Lançamento não encontrado")

        // extrai o número da parcela da descrição (ex: "Aluguel (3/12)" → 3)
        const match = lancamento.descricao?.match(/\((\d+)\/\d+\)/)
        const numeroAtual = match ? parseInt(match[1]) : 1

        const { error } = await supabase
            .from("lancamentos")
            .delete()
            .eq("id_parcelamento", idParcelamento)
            .gte("descricao", "") // workaround: fetch todos, depois deleta via loop

        if (error) throw error
    }
}