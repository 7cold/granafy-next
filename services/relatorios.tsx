import { supabase } from "@/lib/supabase"
import { SaldoDia } from "@/hooks/useSaldoDia"

export async function getSaldosPorPeriodo(
    dataInicio: string,
    dataFim: string
): Promise<Record<string, SaldoDia>> {
    // pega email do usuário logado
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase.rpc("get_saldo_react", {
        data_inicio: dataInicio,
        data_fim: dataFim,
        user_email: user?.email,
    })
    if (error) throw error

    return Object.fromEntries(
        (data as SaldoDia[]).map((s) => [s.dia, s])
    )
}