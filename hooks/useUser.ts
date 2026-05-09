import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useUser() {
    return useQuery({
        queryKey: ["user-session"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            return user
        },
        staleTime: 1000 * 60 * 60, // 1 hora de cache, já que o user não muda sem re-login
    })
}
