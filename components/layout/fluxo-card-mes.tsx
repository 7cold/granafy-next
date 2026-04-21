"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getSaldosPorPeriodo } from "@/services/relatorios"
import { useContas } from "@/services/contas"
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { format, getDaysInMonth, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useLancamentosStore } from "@/store/lancamentosStore"

function useResultadoMes(mes: number, ano: number) {
    const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`
    const ultimoDia = getDaysInMonth(new Date(ano, mes - 1))
    const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`

    return useQuery({
        queryKey: ["relatorio-resultado-mes", mes, ano],
        // substitua apenas o queryFn dentro de useResultadoMes
        queryFn: async () => {



            const hoje = new Date()
            const diaAtual =
                hoje.getMonth() + 1 === mes && hoje.getFullYear() === ano
                    ? hoje.getDate()
                    : ultimoDia

            // calcula o último dia do mês ANTERIOR
            const dataUltimoDiaMesAnterior = new Date(ano, mes - 1, 0) // dia 0 = último dia do mês anterior
            const anoMesAnterior = dataUltimoDiaMesAnterior.getFullYear()
            const mesMesAnterior = dataUltimoDiaMesAnterior.getMonth() + 1
            const diaUltimoDiaMesAnterior = dataUltimoDiaMesAnterior.getDate()

            const dataUltimoDiaFormatada = `${anoMesAnterior}-${String(mesMesAnterior).padStart(2, "0")}-${String(diaUltimoDiaMesAnterior).padStart(2, "0")}`

            // busca saldo do último dia do mês anterior (será o saldo inicial)
            const saldoMesAnterior = await getSaldosPorPeriodo(
                dataUltimoDiaFormatada,
                dataUltimoDiaFormatada
            )




            const saldoInicial = Object.values(saldoMesAnterior)[0]?.saldo_final ?? 0

            // agora busca os lançamentos do mês atual
            const saldosPorDia = await getSaldosPorPeriodo(dataInicio, dataFim)

            const dias = Array.from({ length: ultimoDia }, (_, i) => {
                const dia = i + 1
                const chave = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
                const registro = saldosPorDia[chave]
                return {
                    dia: String(dia).padStart(2, "0"),
                    chave,
                    isFuturo: dia > diaAtual,
                    saldoFinal: registro?.saldo_final ?? null,
                }
            })

            // preenche dias sem lançamento com o último saldo conhecido
            let ultimoSaldo = saldoInicial
            const diasPreenchidos = dias.map((d) => {
                if (d.saldoFinal !== null) {
                    ultimoSaldo = d.saldoFinal
                    return { ...d, saldo: d.saldoFinal }
                }
                return { ...d, saldo: ultimoSaldo }
            })

            const ultimoDiaPassadoIndex = diasPreenchidos.findLastIndex((d) => !d.isFuturo)

            return diasPreenchidos.map((d, i) => ({
                ...d,
                saldoSolido: d.isFuturo ? null : d.saldo,
                saldoTracejado: i >= ultimoDiaPassadoIndex ? d.saldo : null,
            }))

        },
    })
}


const chartConfig = {
    saldoSolido: { label: "Saldo", color: "#4ade80" },
    saldoTracejado: { label: "Saldo", color: "#4ade80" },
} satisfies ChartConfig

export function ResultadoMesAtualCard() {
    const hoje = new Date()
    const [mesRef, setMesRef] = useState(hoje)

    const contasSelecionadas = useLancamentosStore((s) => s.contasSelecionadas)
    const [contaId, setContaId] = useState<number | null>(
        contasSelecionadas?.[0]?.id ?? null
    )
    const { data: contas } = useContas()

    const mes = mesRef.getMonth() + 1
    const ano = mesRef.getFullYear()
    const isMesAtual = mes === hoje.getMonth() + 1 && ano === hoje.getFullYear()

    const { data: dias, isLoading } = useResultadoMes(mes, ano)

    const diaAtualIndex = isMesAtual ? hoje.getDate() - 1 : (dias?.length ?? 1) - 1
    const saldoAtual = dias?.[diaAtualIndex]?.saldo ?? 0
    const saldoAnterior = diaAtualIndex > 0 ? (dias?.[diaAtualIndex - 1]?.saldo ?? 0) : 0
    const variacao = saldoAnterior !== 0
        ? ((Number(saldoAtual) - Number(saldoAnterior)) / Math.abs(Number(saldoAnterior))) * 100
        : 0
    const positivo = variacao >= 0

    const mesLabel = format(mesRef, "MMMM 'de' yyyy", { locale: ptBR })
    const mesCapitalizado = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)

    const fmt = (v: number) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

    const CustomDot = (props: any) => {
        const { cx, cy, value, index } = props
        if (value === null || value === undefined) return null
        const isFuturo = dias?.[index]?.isFuturo
        if (isFuturo) {
            return <circle cx={cx} cy={cy} r={2} stroke="#4ade80" strokeWidth={1.5} fill="transparent" />
        }
        return <circle cx={cx} cy={cy} r={2} fill="#4ade80" />
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle>Resultado do Mês</CardTitle>
                        <CardDescription>
                            Saldo acumulado dia a dia — {mesCapitalizado}
                        </CardDescription>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <Select
                        value={contaId?.toString() ?? "todas"}
                        onValueChange={(v) => setContaId(v === "todas" ? null : Number(v))}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Todas as contas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todas">Todas as contas</SelectItem>
                            {(contas ?? []).map((c) => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                    {c.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="h-50 flex items-center justify-center text-muted-foreground text-sm">
                        Carregando...
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => setMesRef((prev) => subMonths(prev, 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <ChartContainer config={chartConfig} className="h-50 w-full">
                            <LineChart
                                accessibilityLayer
                                data={dias}
                            >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="dia"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    interval={4}
                                />
                                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            hideLabel={false}
                                            formatter={(value, _name, item) => {
                                                if (value === null || value === undefined) return null
                                                return (
                                                    <span className={Number(value) >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                                        {fmt(Number(value))}
                                                        {item.payload.isFuturo && (
                                                            <span className="ml-1 text-xs text-muted-foreground">(prev.)</span>
                                                        )}
                                                    </span>
                                                )
                                            }}
                                        />
                                    }
                                />
                                <Line
                                    dataKey="saldoSolido"
                                    type="linear"
                                    stroke="#4ade80"
                                    strokeWidth={2}
                                    dot={<CustomDot />}
                                    connectNulls={false}
                                />
                                <Line
                                    dataKey="saldoTracejado"
                                    type="linear"
                                    stroke="#4ade80"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    strokeOpacity={0.5}
                                    dot={<CustomDot />}
                                    connectNulls={false}
                                />
                            </LineChart>
                        </ChartContainer>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => setMesRef((prev) => addMonths(prev, 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className={`flex gap-2 leading-none font-medium ${positivo ? "text-emerald-600" : "text-rose-600"}`}>
                    {positivo
                        ? `Alta de ${variacao.toFixed(1)}% em relação ao dia anterior`
                        : `Queda de ${Math.abs(variacao).toFixed(1)}% em relação ao dia anterior`}
                    {positivo ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
                <div className="leading-none text-muted-foreground">
                    Saldo acumulado: {fmt(Number(saldoAtual))}
                </div>
            </CardFooter>
        </Card>
    )
}