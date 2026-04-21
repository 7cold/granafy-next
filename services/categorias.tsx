"use client"
import { useQuery, useMutation } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

// Types
export interface Categoria {
    id: number
    created_at: string
    nome: string | null
    cor: string | null
    user: string | null
    tipo: string | null
    ativo: boolean | null
}

export interface CreateCategoriaInput {
    nome: string
    cor?: string
    user?: string
    tipo?: string
    ativo?: boolean
}

export interface UpdateCategoriaInput {
    nome?: string
    cor?: string
    tipo?: string
    ativo?: boolean
}

const { data: { user } } = await supabase.auth.getUser()


// Hook para buscar categorias
export function useCategorias() {
    return useQuery({
        queryKey: ["categorias"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("categorias")
                .select("*").eq("user", user?.email)
                .order("created_at", { ascending: false })

            if (error) throw error
            return data as Categoria[]
        },
        staleTime: 1000 * 60 * 5, // Cache de 5 minutos
    })
}

// Hook para adicionar categoria
export function useAddCategoria() {
    return useMutation({
        mutationFn: async (newCategoria: CreateCategoriaInput) => {
            const { data, error } = await supabase
                .from("categorias")
                .insert({
                    nome: newCategoria.nome,
                    cor: newCategoria.cor || null,
                    user: user?.email || null,
                    tipo: newCategoria.tipo || null,
                    ativo: newCategoria.ativo ?? true, // Por padrão, categoria fica ativa
                })
                .select()
                .single()

            if (error) throw error
            return data as Categoria
        },
    })
}

// Hook para editar categoria
export function useEditCategoria() {
    return useMutation({
        mutationFn: async ({
            id,
            updates
        }: {
            id: number
            updates: UpdateCategoriaInput
        }) => {
            const { data, error } = await supabase
                .from("categorias")
                .update(updates)
                .eq("id", id)
                .select()
                .single()

            if (error) throw error
            return data as Categoria
        },
    })
}

// Hook para desativar/ativar categoria
export function useToggleCategoria() {
    return useMutation({
        mutationFn: async ({
            id,
            ativo
        }: {
            id: number
            ativo: boolean
        }) => {
            const { data, error } = await supabase
                .from("categorias")
                .update({ ativo })
                .eq("id", id)
                .select()
                .single()

            if (error) throw error
            return data as Categoria
        },
    })
}

// Hook para deletar categoria (caso necessário)
export function useDeleteCategoria() {
    return useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase
                .from("categorias")
                .delete()
                .eq("id", id)

            if (error) throw error
            return id
        },
    })
}