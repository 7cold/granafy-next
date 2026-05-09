// hooks/useParcelasProximasDoFim.ts
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useParcelasProximasDoFim() {
    return useQuery({
        queryKey: ["parcelas-proximas-fim"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()

            // busca lançamentos com parcelamento que estão na última parcela
            const { data } = await supabase
                .from("lancamentos")
                .select("id, descricao, id_parcelamento")
                .eq("user", user?.email)
                .not("id_parcelamento", "is", null)
                .order("data", { ascending: false })

            if (!data) return []

            // agrupa por id_parcelamento e conta quantas parcelas cada um tem
            const grupos = data.reduce((acc: any, l: any) => {
                if (!acc[l.id_parcelamento]) {
                    acc[l.id_parcelamento] = {
                        id_parcelamento: l.id_parcelamento,
                        descricao: l.descricao,
                        count: 0,
                    }
                }
                acc[l.id_parcelamento].count += 1
                return acc
            }, {})

            // filtra só os que têm 2 ou menos parcelas restantes (últimas)
            return Object.values(grupos)
                .filter((g: any) => g.count <= 2)
                .slice(0, 5) // mostra no máximo 5 notificações
        },
    })
}