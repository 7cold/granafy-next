import { supabase } from "@/lib/supabase"
import { SaldoDia } from "@/hooks/useSaldoDia"

export async function getSaldosPorPeriodo(
    dataInicio: string,
    dataFim: string,
    idsContas?: number[],
    apenasPagos: boolean = true,
    userEmail?: string
): Promise<Record<string, SaldoDia>> {
    let email = userEmail

    if (!email) {
        const { data: { user } } = await supabase.auth.getUser()
        email = user?.email
    }

    const { data, error } = await supabase.rpc("get_saldo_react", {
        data_inicio: dataInicio,
        data_fim: dataFim,
        user_email: email,
        ids_contas: idsContas && idsContas.length > 0 ? idsContas : null,
        apenas_pagos: apenasPagos
    })
    if (error) throw error

    return Object.fromEntries(
        (data as SaldoDia[]).map((s) => [s.dia, s])
    )
}