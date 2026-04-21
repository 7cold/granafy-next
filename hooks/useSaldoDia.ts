import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type SaldoDia = {
    dia: string
    saldo_inicial: number
    total_dia: number
    saldo_final: number
}

export function useSaldosPorDia(dataInicio: string, dataFim: string) {
    return useQuery({
        queryKey: ['saldos-por-dia', dataInicio, dataFim],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase.rpc('get_saldo_react', {
                data_inicio: dataInicio,
                data_fim: dataFim,
                user_email: user?.email,
            })
            if (error) throw error

            return Object.fromEntries(
                (data as SaldoDia[]).map((s) => [s.dia, s])
            ) as Record<string, SaldoDia>
        },
        enabled: !!dataInicio && !!dataFim,
    })
}