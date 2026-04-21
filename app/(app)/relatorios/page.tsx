// page/relatorios.tsx

import { FluxoCard } from "@/components/layout/fluxo-card";
import { ResultadoAnualCard } from "@/components/layout/fluxo-card-anual";
import { ResultadoMesAtualCard } from "@/components/layout/fluxo-card-mes";
import { CategoriasMesCard } from "@/components/layout/fluxo-card-piechart";

export default function RelatorioPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="border-b">
                <div className="flex flex-col space-y-1.5 p-6 md:p-8">
                    <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
                    <p className="text-muted-foreground">Análise de fluxo de caixa dos últimos 6 meses</p>
                </div>
            </div>

            <div className="p-6 md:p-8 gap-8 flex flex-col">
                <FluxoCard />
                <ResultadoAnualCard />
                <CategoriasMesCard />
                <ResultadoMesAtualCard />
            </div>
        </div>
    );
}