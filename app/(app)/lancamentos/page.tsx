"use client"
import { useQuery } from "@tanstack/react-query"
import { getLancamentosFilter } from "@/services/lancamentos"
import { DataTable } from "@/components/layout/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { DialogLancamento } from "@/components/layout/dialog-lancamento"
import { ComponenteContas } from "@/components/layout/comp_contas"
import { useLancamentosStore } from "../../../store/lancamentosStore"
import { ComponenteMesAno } from "@/components/layout/comp-mesano"
import { ResumoFinanceiro } from "@/components/layout/resumoSaldo"
import { Badge } from "@/components/ui/badge"
import { useContas } from "@/services/contas"
import { useCategorias } from "@/services/categorias"

type Lancamentos = {
    id: number
    descricao: string
    valor: number
    data: string
    pago: string
    conta_id: number
}

const columns: ColumnDef<Lancamentos>[] = [
    { accessorKey: "descricao", header: "Descrição" },

    {
        accessorKey: "valor",
        header: "Valor",
        cell: ({ getValue }) => {
            const value = Number(getValue())

            return (
                <span className={value < 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                    {value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                    })}
                </span>
            )
        }
    },

    {
        accessorKey: "pago",
        header: "Pago",
        cell: ({ getValue }) => (
            <Badge variant="outline" className="px-1.5 text-muted-foreground">
                {getValue() ? "Pago" : "Pendente"}
            </Badge>
        )
    },

    {
        accessorKey: "data", header: "Data", cell: ({ getValue }) => (
            new Date(getValue() as string + 'T00:00:00').toLocaleDateString('pt-BR')
        )
    },
    {
        accessorKey: "conta_id", header: "Conta", cell: ({ getValue }) => {
            const { data: contas } = useContas()
            const contasMap = Object.fromEntries(
                (contas ?? []).map(c => [c.id, c.nome])
            )
            return (
                contasMap[getValue() as number] ?? "-"
            )
        }
    }, {
        accessorKey: "categoria_id", header: "Categoria", cell: ({ getValue }) => {
            const { data: cat } = useCategorias()
            const catmap = Object.fromEntries(
                (cat ?? []).map(c => [c.id, c.nome])
            )
            return (
                catmap[getValue() as number] ?? "-"
            )
        }
    },
]

export default function Page() {

    const [open, setOpen] = useState(false)
    const contasSelecionadas = useLancamentosStore(s => s.contasSelecionadas)
    const { mesSelecionado, anoSelecionado, setMes, setAno } = useLancamentosStore()
    const idsContas = contasSelecionadas.map(c => c.id)
    const { data = [], isFetching } = useQuery({
        queryKey: [
            "lancamentos",
            idsContas,
            mesSelecionado,
            anoSelecionado
        ],
        queryFn: () =>
            getLancamentosFilter({
                idsContas,
                mes: mesSelecionado,
                ano: anoSelecionado
            }),
        enabled: idsContas.length > 0 &&
            mesSelecionado !== null &&
            anoSelecionado !== null,
        placeholderData: (prev) => prev
    })

    return (
        <>
            <DialogLancamento open={open} onOpenChange={setOpen} />
            <div className="flex flex-wrap gap-2 m-5">
                <ComponenteContas />
                <ComponenteMesAno />
                <Button className="w-50 ml-auto" onClick={() => setOpen(true)}>Adicionar Lançamento</Button>
            </div>
            {isFetching ? (
                <p className="text-sm text-muted-foreground">Atualizando filtros...</p>
            ) : <DataTable columns={columns} data={data} />}
            <ResumoFinanceiro data={data} />

        </>
    )
}