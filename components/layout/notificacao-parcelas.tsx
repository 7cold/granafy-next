// components/notificacao-parcelas.tsx
"use client"

import { useParcelasProximasDoFim } from "@/hooks/useParcelasProximasDoFim"
import { AlertCircle, X } from "lucide-react"
import { useState } from "react"

export function NotificacaoParcelas() {
    const { data: parcelasProximas = [] } = useParcelasProximasDoFim()
    const [descartadas, setDescartadas] = useState<number[]>([])

    const parcelasVisiveis = parcelasProximas.filter(
        (p: any) => !descartadas.includes(p.id_parcelamento)
    )

    if (!parcelasVisiveis.length) return null

    return (
        <div className="space-y-2 p-4">
            {parcelasVisiveis.map((parcela: any) => (
                <div
                    key={parcela.id_parcelamento}
                    className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-900">
                            {parcela.descricao}
                        </p>
                        <p className="text-xs text-amber-700">
                            Últimas {parcela.count} parcela{parcela.count > 1 ? "s" : ""}
                        </p>
                    </div>
                    <button
                        onClick={() => setDescartadas([...descartadas, parcela.id_parcelamento])}
                        className="text-amber-600 hover:text-amber-900"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}