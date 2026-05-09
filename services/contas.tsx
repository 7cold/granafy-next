"use client"
import { useQuery, useMutation } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

// Types
export interface Conta {
    id: number
    created_at: string
    nome: string | null
    cor: string | null
    ativo: boolean | null
    user: string | null
    id_banco: number | null
}

export interface CreateContaInput {
    nome: string
    cor?: string
    user?: string
    id_banco?: number
    ativo?: boolean
}

export interface UpdateContaInput {
    nome?: string
    cor?: string
    id_banco?: number
    ativo?: boolean
}

const { data: { user } } = await supabase.auth.getUser()

// Hook para buscar contas
export function useContas() {
    return useQuery({
        queryKey: ["contas"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("contas")
                .select("*").eq("user", user?.email)
                .order("created_at", { ascending: false })

            if (error) throw error
            return data as Conta[]
        },
        staleTime: 1000 * 60 * 5, // Cache de 5 minutos
    })
}

// Hook para adicionar conta
export function useAddConta() {
    return useMutation({
        mutationFn: async (newConta: CreateContaInput) => {
            const { data, error } = await supabase
                .from("contas")
                .insert({
                    nome: newConta.nome,
                    cor: newConta.cor || null,
                    user: user?.email || null,
                    id_banco: newConta.id_banco || null,
                    ativo: newConta.ativo ?? true, // Por padrão, conta fica ativa
                })
                .select()
                .single()

            if (error) throw error
            return data as Conta
        },
    })
}

// Hook para editar conta
export function useEditConta() {
    return useMutation({
        mutationFn: async ({
            id,
            updates
        }: {
            id: number
            updates: UpdateContaInput
        }) => {
            const { data, error } = await supabase
                .from("contas")
                .update(updates)
                .eq("id", id)
                .select()
                .single()

            if (error) throw error
            return data as Conta
        },
    })
}

// Hook para desativar/ativar conta
export function useToggleConta() {
    return useMutation({
        mutationFn: async ({
            id,
            ativo
        }: {
            id: number
            ativo: boolean
        }) => {
            const { data, error } = await supabase
                .from("contas")
                .update({ ativo })
                .eq("id", id)
                .select()
                .single()

            if (error) throw error
            return data as Conta
        },
    })
}

// Hook para deletar conta (caso necessário)
export function useDeleteConta() {
    return useMutation({
        mutationFn: async (id: number) => {
            // Primeiro remove todos os lançamentos vinculados à conta
            const { error: errorLancamentos } = await supabase
                .from("lancamentos")
                .delete()
                .eq("conta_id", id)

            if (errorLancamentos) throw errorLancamentos

            // Depois exclui a conta
            const { error } = await supabase
                .from("contas")
                .delete()
                .eq("id", id)

            if (error) throw error
            return id
        },
    })
}