"use client"
import { useQuery, useMutation } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface Cartao {
    id: number
    created_at: string
    nome: string | null
    ativo: boolean | null
    user: string | null
    id_conta: number | null
    id_banco: number | null
    dia_vencimento: number | null
    dia_fechamento: number | null
}

export interface CreateCartaoInput {
    nome: string
    id_conta: number
    dia_vencimento: number
    dia_fechamento: number
}

export interface UpdateCartaoInput {
    nome?: string
    id_conta?: number
    dia_vencimento?: number
    dia_fechamento?: number
    ativo?: boolean
}

const { data: { user } } = await supabase.auth.getUser()

export function useCartoes() {
    return useQuery({
        queryKey: ["cartoes"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("cartoes")
                .select("*").eq("user", user?.email)
                .order("created_at", { ascending: false })

            if (error) throw error
            return data as Cartao[]
        },
        staleTime: 1000 * 60 * 5,
    })
}

export function useAddCartao() {
    return useMutation({
        mutationFn: async (newCartao: CreateCartaoInput) => {
            const { data, error } = await supabase
                .from("cartoes")
                .insert({
                    nome: newCartao.nome,
                    id_conta: newCartao.id_conta,
                    dia_vencimento: newCartao.dia_vencimento,
                    dia_fechamento: newCartao.dia_fechamento,
                    user: user?.email || null,
                    id_banco: 1, // Fixado no backend
                    ativo: true, // Ativo por padrão
                })
                .select()
                .single()

            if (error) throw error
            return data as Cartao
        },
    })
}

export function useEditCartao() {
    return useMutation({
        mutationFn: async ({
            id,
            updates
        }: {
            id: number
            updates: UpdateCartaoInput
        }) => {
            const { data, error } = await supabase
                .from("cartoes")
                .update(updates)
                .eq("id", id)
                .select()
                .single()

            if (error) throw error
            return data as Cartao
        },
    })
}

export function useToggleCartao() {
    return useMutation({
        mutationFn: async ({
            id,
            ativo
        }: {
            id: number
            ativo: boolean
        }) => {
            const { data, error } = await supabase
                .from("cartoes")
                .update({ ativo })
                .eq("id", id)
                .select()
                .single()

            if (error) throw error
            return data as Cartao
        },
    })
}

export function useDeleteCartao() {
    return useMutation({
        mutationFn: async (id: number) => {
            // Primeiro remove todos os lançamentos vinculados ao cartão
            const { error: errorLancamentos } = await supabase
                .from("lancamentos")
                .delete()
                .eq("id_cartao", id)

            if (errorLancamentos) throw errorLancamentos

            // Depois exclui o cartão
            const { error } = await supabase
                .from("cartoes")
                .delete()
                .eq("id", id)

            if (error) throw error
            return id
        },
    })
}
