"use client"

import { useQuery } from "@tanstack/react-query"
import { getLancamentosComCategoria } from "@/services/lancamentos"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const CORES = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
]

function useCategoriasMesAtual() {
    return useQuery({
        queryKey: ["relatorio-categorias-mes-atual"],
        queryFn: async () => {
            const hoje = new Date()
            const mes = hoje.getMonth() + 1
            const ano = hoje.getFullYear()

            const data = await getLancamentosComCategoria({ mes, ano })

            const recebimentos: Record<string, number> = {}
            const despesas: Record<string, number> = {}

            for (const l of data ?? []) {
                const cat = l.categoriaNome ?? "Sem categoria"
                if (l.valor > 0) {
                    recebimentos[cat] = (recebimentos[cat] ?? 0) + l.valor
                } else {
                    despesas[cat] = (despesas[cat] ?? 0) + Math.abs(l.valor)
                }
            }

            return {
                recebimentos: Object.entries(recebimentos).map(([cat, valor]) => ({ cat, valor })),
                despesas: Object.entries(despesas).map(([cat, valor]) => ({ cat, valor })),
            }
        },
    })
}

function buildChartConfig(items: { cat: string }[]): ChartConfig {
    return Object.fromEntries(
        items.map((item, i) => [
            item.cat,
            { label: item.cat, color: CORES[i % CORES.length] },
        ])
    )
}

const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

function PieSection({
    title,
    items,
    emptyMessage,
}: {
    title: string
    items: { cat: string; valor: number }[]
    emptyMessage: string
}) {
    const config = buildChartConfig(items)
    const total = items.reduce((s, i) => s + i.valor, 0)

    if (items.length === 0) {
        return (
            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">{title}</p>
                <div className="h-45 flex items-center justify-center text-muted-foreground text-sm">
                    {emptyMessage}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">{title}</p>
            <ChartContainer config={config} className="h-45 w-full">
                <PieChart>
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                formatter={(value, name) => (
                                    <span>
                                        {name}: <strong>{fmt(Number(value))}</strong>
                                    </span>
                                )}
                            />
                        }
                    />
                    <Pie
                        data={items}
                        dataKey="valor"
                        nameKey="cat"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                    >
                        {items.map((_, i) => (
                            <Cell key={i} fill={CORES[i % CORES.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ChartContainer>

            <div className="flex flex-col gap-1.5">
                {items.map((item, i) => (
                    <div key={item.cat} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                            <span
                                className="inline-block h-2 w-2 rounded-full shrink-0"
                                style={{ background: CORES[i % CORES.length] }}
                            />
                            <span className="text-muted-foreground truncate max-w-30">{item.cat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{fmt(item.valor)}</span>
                            <span className="text-muted-foreground w-10 text-right mr-5">
                                {((item.valor / total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                ))}
                <div className="flex items-center justify-between text-xs pt-1 border-t mt-0.5 mr-5">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{fmt(total)}</span>
                </div>
            </div>
        </div>
    )
}

export function CategoriasMesCard() {
    const { data, isLoading } = useCategoriasMesAtual()

    const hoje = new Date()
    const mesLabel = format(hoje, "MMMM 'de' yyyy", { locale: ptBR })
    const mesCapitalizado = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Categorias do Mês</CardTitle>
                <CardDescription>{mesCapitalizado}</CardDescription>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="h-50 flex items-center justify-center text-muted-foreground text-sm">
                        Carregando...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:divide-x">
                        <PieSection
                            title="Recebimentos"
                            items={data?.recebimentos ?? []}
                            emptyMessage="Nenhum recebimento neste mês"
                        />
                        <div className="sm:pl-8">
                            <PieSection
                                title="Despesas"
                                items={data?.despesas ?? []}
                                emptyMessage="Nenhuma despesa neste mês"
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}