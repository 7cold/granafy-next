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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useContas } from "@/services/contas"
import { supabase } from "@/lib/supabase"
import { format, startOfMonth, setMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

import { useLancamentosStore } from "@/store/lancamentosStore"
import { useUser } from "@/hooks/useUser"
import { useCartoes } from "@/services/cartoes"

function useResultadoAnual(apenasLancamentosPagos: boolean, idsContas?: number[]) {
    const { data: user } = useUser()
    const { data: cartoes = [] } = useCartoes()

    return useQuery({
        queryKey: ["relatorio-resultado-anual", apenasLancamentosPagos, idsContas, cartoes?.length, user?.email],
        enabled: !!user?.email,
        queryFn: async () => {
            const hoje = new Date()
            const anoAtual = hoje.getFullYear()
            const mesAtual = hoje.getMonth()

            // Busca os lançamentos do ano com lógica de OR para contas e cartões
            const dataInicioAno = `${anoAtual}-01-01`
            const dataFimAno = `${anoAtual}-12-31`

            let query = supabase
                .from("lancamentos")
                .select("*")
                .eq("user", user?.email)
                .gte("data", dataInicioAno)
                .lte("data", dataFimAno)

            if (idsContas && idsContas.length > 0) {
                const idsCartoesRelacionados = cartoes
                    .filter(c => c.id_conta && idsContas.includes(c.id_conta))
                    .map(c => c.id)

                let filterStr = `conta_id.in.(${idsContas.join(",")})`
                if (idsCartoesRelacionados.length > 0) {
                    filterStr += `,id_cartao.in.(${idsCartoesRelacionados.join(",")})`
                }
                query = query.or(filterStr)
            }

            const { data, error } = await query
            if (error) throw error

            // 1. Calcular o Saldo Inicial das Contas
            const { data: contasInfo } = await supabase
                .from("contas")
                .select("saldo_inicial")
                .eq("user", user?.email)
                .in("id", idsContas && idsContas.length > 0 ? idsContas : (await supabase.from("contas").select("id").eq("user", user?.email)).data?.map(c => c.id) || [])

            const saldoInicialContas = (contasInfo ?? []).reduce((acc, c) => acc + (c.saldo_inicial || 0), 0)

            // 2. Calcular o acumulado de anos anteriores (até 31/12 do ano passado)
            let anteriorQuery = supabase
                .from("lancamentos")
                .select("valor")
                .eq("user", user?.email)
                .lt("data", dataInicioAno)

            if (idsContas && idsContas.length > 0) {
                const idsCartoesRelacionados = cartoes
                    .filter(c => c.id_conta && idsContas.includes(c.id_conta))
                    .map(c => c.id)

                let filterStr = `conta_id.in.(${idsContas.join(",")})`
                if (idsCartoesRelacionados.length > 0) {
                    filterStr += `,id_cartao.in.(${idsCartoesRelacionados.join(",")})`
                }
                anteriorQuery = anteriorQuery.or(filterStr)
            }

            const { data: anteriorData } = await anteriorQuery.returns<{ valor: number }[]>()

            const saldoAnosAnteriores = (anteriorData ?? []).reduce((acc, l) => acc + (l.valor || 0), 0)

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
                return l.pago === true
            })

            for (const l of lancamentos) {
                let dataFinanceira = l.data;

                if (l.id_cartao) {
                    const c = cartoes.find(card => card.id === l.id_cartao);
                    if (c) {
                        const d = new Date(l.data + 'T00:00:00');
                        const diaCompra = d.getDate();
                        const mesCompra = d.getMonth();
                        const anoCompra = d.getFullYear();

                        let mesVencimento = mesCompra + (diaCompra <= (c.dia_fechamento || 28) ? 1 : 2);
                        const targetDate = new Date(anoCompra, mesVencimento, c.dia_vencimento || 1);
                        dataFinanceira = format(targetDate, 'yyyy-MM-dd');
                    }
                }

                const chave = dataFinanceira.slice(0, 7)
                const m = meses.find((m) => m.chave === chave)
                if (m) m.saldo += l.valor
            }

            let acumulado = saldoInicialContas + saldoAnosAnteriores
            return meses.map((m) => {
                acumulado += m.saldo
                return { ...m, saldo: acumulado }
            })
        },
        staleTime: 1000 * 60 * 5,
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
    const { setMes, setAno } = useLancamentosStore()
    const contasSelecionadasGlobal = useLancamentosStore((s) => s.contasSelecionadas)
    const [contaId, setContaId] = useState<number | null>(contasSelecionadasGlobal?.[0]?.id ?? null)
    const { data: contas } = useContas()

    const idsContas = contaId ? [contaId] : []
    const { data: meses, isLoading } = useResultadoAnual(apenasLancamentosPagos, idsContas)

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
                            id="apenas-pagos-anual"
                            checked={apenasLancamentosPagos}
                            onCheckedChange={(v) => setApenasLancamentosPagos(Boolean(v))}
                        />
                        <Label htmlFor="apenas-pagos-anual" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                            Somente pagos
                        </Label>
                    </div>
                </div>

                <div className="mt-4">
                    <Select
                        value={contaId?.toString() ?? "todas"}
                        onValueChange={(v) => setContaId(v === "todas" ? null : Number(v))}
                    >
                        <SelectTrigger className="w-full md:w-64">
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
                    <ChartContainer config={chartConfig}
                        className="h-50 w-full cursor-pointer"
                    >
                        <LineChart
                            accessibilityLayer
                            data={meses}
                            onMouseDown={(e) => {
                                if (meses && e && e.activeTooltipIndex != null) {
                                    const dataPoint = meses[e.activeTooltipIndex as number];
                                    if (dataPoint) {
                                        const [y, m] = dataPoint.chave.split("-");
                                        setMes(Number(m));
                                        setAno(Number(y));
                                    }
                                }
                            }}
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