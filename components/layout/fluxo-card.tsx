// Adicione ao page/relatorios.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { getLancamentosFilter } from '@/services/lancamentos';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── hook que busca e agrega os dados dos últimos 6 meses ──────────────────────
import { useCartoes, Cartao } from '@/services/cartoes';
import { supabase } from '@/lib/supabase';
import { addMonths } from 'date-fns';
import { useUser } from '@/hooks/useUser';

function useFluxo6Meses(idsContas?: number[]) {
    const { data: user } = useUser();
    const { data: cartoes = [] } = useCartoes();

    return useQuery({
        queryKey: ['relatorio-fluxo-6meses', idsContas, cartoes?.length, user?.email],
        enabled: !!user?.email,
        queryFn: async () => {
            const hoje = new Date();

            const meses = Array.from({ length: 6 }, (_, i) => {
                const d = subMonths(startOfMonth(hoje), 5 - i);
                return { mes: d.getMonth() + 1, ano: d.getFullYear(), date: d };
            });

            // Buscar lançamentos que podem impactar os últimos 6 meses
            // Gastos de cartão de até 2 meses antes do início podem vencer agora.
            const dataBuscaInicio = format(subMonths(meses[0].date, 2), 'yyyy-MM-01');
            
            let query = supabase
                .from("lancamentos")
                .select("*")
                .eq("user", user?.email)
                .gte("data", dataBuscaInicio)
                .eq("pago", true); // Apenas o que foi pago impacta o fluxo real

            if (idsContas && idsContas.length > 0) {
                // Filtro complexo: conta_id na lista OU (id_cartao na lista de cartões daquelas contas)
                const idsCartoesRelacionados = cartoes
                    .filter(c => c.id_conta && idsContas.includes(c.id_conta))
                    .map(c => c.id);

                let filterStr = `conta_id.in.(${idsContas.join(",")})`;
                if (idsCartoesRelacionados.length > 0) {
                    filterStr += `,id_cartao.in.(${idsCartoesRelacionados.join(",")})`;
                }
                query = query.or(filterStr);
            }

            const { data: lancamentos, error } = await query;
            if (error) throw error;

            const agrupado: Record<string, { entradas: number; saidas: number }> = {};
            for (const m of meses) {
                const chave = format(m.date, 'yyyy-MM');
                agrupado[chave] = { entradas: 0, saidas: 0 };
            }

            for (const l of lancamentos || []) {
                let dataFinanceira = l.data;

                // Lógica de Teletransporte para Cartão
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

                const chave = dataFinanceira.slice(0, 7); // "yyyy-MM"
                if (!agrupado[chave]) continue;

                const valor = Number(l.valor);
                if (valor > 0) agrupado[chave].entradas += valor;
                else agrupado[chave].saidas += Math.abs(valor);
            }

            return meses.map((m) => {
                const chave = format(m.date, 'yyyy-MM');
                const label = format(m.date, 'MMM', { locale: ptBR });
                return {
                    mes: label.charAt(0).toUpperCase() + label.slice(1),
                    entradas: agrupado[chave].entradas,
                    saidas: agrupado[chave].saidas,
                };
            });
        },
        staleTime: 1000 * 60 * 5,
    });
}

import { useLancamentosStore } from '@/store/lancamentosStore';

// ── componente do card ────────────────────────────────────────────────────────
export function FluxoCard() {
    const contasSelecionadas = useLancamentosStore((s) => s.contasSelecionadas);
    const idsContas = (contasSelecionadas || []).map(c => c.id);
    const { data: fluxo, isLoading } = useFluxo6Meses(idsContas);

    const totalEntradas = fluxo?.reduce((s, m) => s + m.entradas, 0) ?? 0;
    const totalSaidas = fluxo?.reduce((s, m) => s + m.saidas, 0) ?? 0;
    const saldo = totalEntradas - totalSaidas;

    const fmt = (v: number) =>
        v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const chartConfig = {
        entradas: { label: 'Entradas', color: '#4ade80' },
        saidas: { label: 'Saídas', color: '#f87171' },
    } satisfies ChartConfig;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fluxo de Caixa</CardTitle>
                <CardDescription>Entradas e saídas dos últimos 6 meses</CardDescription>

                {/* resumo em 3 chips */}
                <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-gray-700    " />
                        <span className="text-muted-foreground">Entradas</span>
                        <span className="font-semibold text-emerald-600">{fmt(totalEntradas)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <TrendingDown className="h-4 w-4 text-gray-700" />
                        <span className="text-muted-foreground">Saídas</span>
                        <span className="font-semibold text-rose-600">{fmt(totalSaidas)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Wallet className="h-4 w-4 text-gray-700" />
                        <span className="text-muted-foreground">Saldo</span>
                        <span className={`font-semibold ${saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {fmt(saldo)}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="h-55 flex items-center justify-center text-muted-foreground text-sm">
                        Carregando...
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-55 w-full">
                        <BarChart data={fluxo} accessibilityLayer >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="mes"
                                tickLine={false}
                                axisLine={false}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="entradas" fill="var(--color-entradas)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="saidas" fill="var(--color-saidas)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}