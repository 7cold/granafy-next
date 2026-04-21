import { supabase } from "@/lib/supabase"
import { SaldoDia } from "@/hooks/useSaldoDia"

export async function getSaldosPorPeriodo(
    dataInicio: string,
    dataFim: string
): Promise<Record<string, SaldoDia>> {
    const { data, error } = await supabase.rpc("get_saldo_react", {
        data_inicio: dataInicio,
        data_fim: dataFim,
    })
    if (error) throw error

    return Object.fromEntries(
        (data as SaldoDia[]).map((s) => [s.dia, s])
    )
}