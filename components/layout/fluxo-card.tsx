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
function useFluxo6Meses() {
    return useQuery({
        queryKey: ['relatorio-fluxo-6meses'],
        queryFn: async () => {
            const hoje = new Date();

            // busca todos os lançamentos dos últimos 6 meses de uma vez
            // (sem filtro de conta para pegar tudo)
            const meses = Array.from({ length: 6 }, (_, i) => {
                const d = subMonths(startOfMonth(hoje), 5 - i);
                return { mes: d.getMonth() + 1, ano: d.getFullYear(), date: d };
            });

            const data = await getLancamentosFilter({
                mes: meses[0].mes,   // início
                ano: meses[0].ano,
                // sem idsContas = busca tudo (ajuste conforme sua lógica)
            });

            // agrupa por mês
            const agrupado: Record<string, { entradas: number; saidas: number }> = {};
            for (const m of meses) {
                const chave = format(m.date, 'yyyy-MM');
                agrupado[chave] = { entradas: 0, saidas: 0 };
            }

            for (const l of data ?? []) {
                const chave = l.data?.slice(0, 7); // "yyyy-MM"
                if (!chave || !agrupado[chave]) continue;
                if (l.valor > 0) agrupado[chave].entradas += l.valor;
                else agrupado[chave].saidas += Math.abs(l.valor);
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
    });
}

// ── componente do card ────────────────────────────────────────────────────────
export function FluxoCard() {
    const { data: fluxo, isLoading } = useFluxo6Meses();

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