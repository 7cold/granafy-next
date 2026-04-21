"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getLancamentosFilter } from "@/services/lancamentos"
import { TrendingUp, TrendingDown } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, ReferenceLine } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { format, startOfMonth, setMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

function useResultadoAnual(apenasLancamentosPagos: boolean) {
    return useQuery({
        queryKey: ["relatorio-resultado-anual", apenasLancamentosPagos],
        queryFn: async () => {
            const hoje = new Date()
            const anoAtual = hoje.getFullYear()
            const mesAtual = hoje.getMonth()

            const data = await getLancamentosFilter({
                ano: anoAtual,
            })

            const meses = Array.from({ length: 12 }, (_, i) => {
                const d = setMonth(startOfMonth(new Date(anoAtual, 0)), i)
                const label = format(d, "MMM", { locale: ptBR })
                return {
                    mes: label.charAt(0).toUpperCase() + label.slice(1),
                    chave: `${anoAtual}-${String(i + 1).padStart(2, "0")}`,
                    isFuturo: i > mesAtual,
                    saldo: 0,
                }
            })

            const lancamentos = (data ?? []).filter((l) => {
                if (!apenasLancamentosPagos) return true
                // entradas sempre contam; só filtra despesas não pagas
                if (l.valor > 0) return true
                return l.pago === true
            })

            for (const l of lancamentos) {
                const chave = l.data?.slice(0, 7)
                const m = meses.find((m) => m.chave === chave)
                if (m) m.saldo += l.valor
            }

            let acumulado = 0
            return meses.map((m) => {
                acumulado += m.saldo
                return { ...m, saldo: acumulado }
            })
        },
    })
}

const chartConfig = {

    saldo: {
        label: "Saldo",
        color: "#4ade80",
    },
} satisfies ChartConfig

export function ResultadoAnualCard() {
    const [apenasLancamentosPagos, setApenasLancamentosPagos] = useState(false)

    const { data: meses, isLoading } = useResultadoAnual(apenasLancamentosPagos)

    const hoje = new Date()
    const mesAtualIndex = hoje.getMonth()
    const anoAtual = hoje.getFullYear()

    const saldoAtual = meses?.[mesAtualIndex]?.saldo ?? 0
    const saldoMesAnterior = mesAtualIndex > 0 ? (meses?.[mesAtualIndex - 1]?.saldo ?? 0) : 0
    const variacao = saldoMesAnterior !== 0
        ? ((Number(saldoAtual) - Number(saldoMesAnterior)) / Math.abs(Number(saldoMesAnterior))) * 100
        : 0
    const positivo = variacao >= 0

    const fmt = (v: number) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

    const CustomDot = (props: any) => {
        const { cx, cy, value } = props
        if (value === null || value === undefined) return null
        return <circle cx={cx} cy={cy} r={3} fill="var(--color-saldo)" />
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle>Resultado do Ano</CardTitle>
                        <CardDescription>
                            Saldo acumulado mês a mês — {anoAtual}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                        <Checkbox
                            id="apenas-pagos"
                            checked={apenasLancamentosPagos}
                            onCheckedChange={(v) => setApenasLancamentosPagos(Boolean(v))}
                        />
                        <Label htmlFor="apenas-pagos" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                            Apenas pagos
                        </Label>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="h-50 flex items-center justify-center text-muted-foreground text-sm">
                        Carregando...
                    </div>
                ) : (
                    <ChartContainer config={chartConfig}
                        className="h-50 w-full"
                    >
                        <LineChart
                            accessibilityLayer
                            data={meses}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="mes"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(v) => v.slice(0, 3)}
                            />
                            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        hideLabel={false}
                                        formatter={(value) => (
                                            <span className={Number(value) >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                                {fmt(Number(value))}
                                            </span>
                                        )}
                                    />
                                }
                            />
                            <Line
                                dataKey="saldo"
                                type="linear"
                                stroke="var(--color-saldo)"
                                strokeWidth={2}
                                dot={<CustomDot />}
                                connectNulls={false}
                            />
                        </LineChart>
                    </ChartContainer>
                )}
            </CardContent>

            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className={`flex gap-2 leading-none font-medium ${positivo ? "text-emerald-600" : "text-rose-600"}`}>
                    {positivo
                        ? `Alta de ${variacao.toFixed(1)}% em relação ao mês anterior`
                        : `Queda de ${Math.abs(variacao).toFixed(1)}% em relação ao mês anterior`}
                    {positivo
                        ? <TrendingUp className="h-4 w-4" />
                        : <TrendingDown className="h-4 w-4" />}
                </div>
                <div className="leading-none text-muted-foreground">
                    Saldo acumulado atual: {fmt(Number(saldoAtual))}
                </div>
            </CardFooter>
        </Card>
    )
}