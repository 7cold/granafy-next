import { useState } from "react"

type Props = {
    data: any[]
    saldoInicial?: number
}

type Filtro = "todos" | "pagos" | "nao_pagos"

export function ResumoFinanceiro({ data, saldoInicial }: Props) {
    const [filtro, setFiltro] = useState<Filtro>("todos")

    const dadosFiltrados = (data || []).filter((item) => {
        if (filtro === "pagos") return item.pago === true
        if (filtro === "nao_pagos") return item.pago === false
        return true
    })

    const resumo = dadosFiltrados.reduce(
        (acc: any, item: any) => {
            const valor = Number(item.valor || 0)
            if (valor >= 0) {
                acc.entradas += valor
            } else {
                acc.saidas += Math.abs(valor)
            }
            acc.saldo = (saldoInicial || 0) + acc.entradas - acc.saidas
            return acc
        },
        { entradas: 0, saidas: 0, saldo: saldoInicial || 0 }
    )

    const tabs: { label: string; value: Filtro }[] = [
        { label: "Todos", value: "todos" },
        { label: "Pagos", value: "pagos" },
        { label: "Não Pagos", value: "nao_pagos" },
    ]

    return (
        <div className="m-5">
            {/* Tabs */}
            <div className="flex border-b mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setFiltro(tab.value)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${filtro === tab.value
                            ? "border-b-2 border-primary text-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-green-50">
                    <p className="text-sm text-muted-foreground">Entradas</p>
                    <p className="text-2xl font-bold text-green-600">
                        {resumo.entradas.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        })}
                    </p>
                </div>

                <div className="border rounded-lg p-4 bg-red-50">
                    <p className="text-sm text-muted-foreground">Saídas</p>
                    <p className="text-2xl font-bold text-red-600">
                        {resumo.saidas.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        })}
                    </p>
                </div>

                <div className="border rounded-lg p-4 bg-muted">
                    <p className="text-sm text-muted-foreground">Saldo</p>
                    <p className={`text-2xl font-bold ${resumo.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {resumo.saldo.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        })}
                    </p>
                </div>
            </div>
        </div>
    )
}