"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"

import { useQuery } from "@tanstack/react-query"
import { getSaldosPorPeriodo } from "@/services/relatorios"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { FluxoCard } from "@/components/layout/fluxo-card"
import { ResultadoAnualCard } from "@/components/layout/fluxo-card-anual"
import { ResultadoMesAtualCard } from "@/components/layout/fluxo-card-mes"
import { CategoriasMesCard } from "@/components/layout/fluxo-card-piechart"

function ResumoCards() {
    const hoje = new Date()
    const mesInicio = format(startOfMonth(hoje), "yyyy-MM-dd")
    const mesFim = format(endOfMonth(hoje), "yyyy-MM-dd")

    // busca saldo total (até hoje, todos os lançamentos pagos)
    const { data: saldoTotal } = useQuery({
        queryKey: ["saldo-total"],
        queryFn: async () => {
            const { supabase } = await import("@/lib/supabase")
            const { data } = await supabase
                .from("lancamentos")
                .select("valor")
                .eq("pago", true)

            return (data ?? []).reduce((acc, l) => acc + (l.valor || 0), 0)
        },
    })

    // busca entradas do mês
    const { data: entradasMes } = useQuery({
        queryKey: ["entradas-mes", mesInicio, mesFim],
        queryFn: async () => {
            const { supabase } = await import("@/lib/supabase")
            const { data } = await supabase
                .from("lancamentos")
                .select("valor")
                .eq("pago", true)
                .gte("data", mesInicio)
                .lte("data", mesFim)
                .gt("valor", 0)

            return (data ?? []).reduce((acc, l) => acc + (l.valor || 0), 0)
        },
    })

    // busca saídas do mês
    const { data: saidasMes } = useQuery({
        queryKey: ["saidas-mes", mesInicio, mesFim],
        queryFn: async () => {
            const { supabase } = await import("@/lib/supabase")
            const { data } = await supabase
                .from("lancamentos")
                .select("valor")
                .eq("pago", true)
                .gte("data", mesInicio)
                .lte("data", mesFim)
                .lt("valor", 0)

            return Math.abs((data ?? []).reduce((acc, l) => acc + (l.valor || 0), 0))
        },
    })

    const fmt = (v: number | undefined) =>
        (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Saldo Total</p>
                        <p className={`text-2xl font-bold ${(saldoTotal ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {fmt(saldoTotal)}
                        </p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Entradas (Mês)</p>
                        <p className="text-2xl font-bold text-emerald-600">
                            {fmt(entradasMes)}
                        </p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Saídas (Mês)</p>
                        <p className="text-2xl font-bold text-rose-600">
                            {fmt(saidasMes)}
                        </p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-rose-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Financeiro</h1>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Row 1: Cards resumo dinâmico */}
                <ResumoCards />

                {/* Row 2: Fluxo 6 meses */}
                <div>
                    <FluxoCard />
                </div>

                {/* Row 3: Resultado anual + Categorias do mês */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <ResultadoAnualCard />
                    </div>
                    <div>
                        <CategoriasMesCard />
                    </div>
                </div>

                {/* Row 4: Resultado do mês atual */}
                <div>
                    <ResultadoMesAtualCard />
                </div>
            </div>
        </>
    )
}