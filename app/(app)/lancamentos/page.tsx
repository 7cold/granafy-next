"use client"
import { useQuery } from "@tanstack/react-query"
import { getLancamentosFilter, getLancamentosCartao } from "@/services/lancamentos"
import { DataTable } from "@/components/layout/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { DialogLancamento } from "@/components/layout/dialog-lancamento"
import { DialogFaturaCartao } from "@/components/layout/dialog-fatura-cartao"
import { ComponenteContas } from "@/components/layout/comp_contas"
import { useLancamentosStore } from "../../../store/lancamentosStore"
import { ComponenteMesAno } from "@/components/layout/comp-mesano"
import { ResumoFinanceiro } from "@/components/layout/resumoSaldo"
import { Badge } from "@/components/ui/badge"
import { useContas } from "@/services/contas"
import { useCategorias } from "@/services/categorias"
import { useCartoes, Cartao } from "@/services/cartoes"
import { PlusIcon, RepeatIcon, CreditCardIcon } from "lucide-react"
type Lancamentos = {
    id: number
    descricao: string
    valor: number
    data: string
    pago: string
    conta_id: number
    id_recorrencia?: number | null
}

const columns: ColumnDef<Lancamentos>[] = [
    { 
        accessorKey: "descricao", 
        header: "Descrição",
        cell: ({ row }) => {
            const { descricao, id_recorrencia, isFatura } = row.original as any
            return (
                <div className="flex items-center gap-2">
                    {id_recorrencia && <RepeatIcon className="h-4 w-4 text-muted-foreground" />}
                    {isFatura && <CreditCardIcon className="h-4 w-4 text-primary" />}
                    <span className={isFatura ? "font-semibold text-primary" : ""}>{descricao}</span>
                </div>
            )
        }
    },

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
    const [selectedCartaoFatura, setSelectedCartaoFatura] = useState<Cartao | null>(null)
    const contasSelecionadas = useLancamentosStore(s => s.contasSelecionadas)
    const { mesSelecionado, anoSelecionado, setMes, setAno } = useLancamentosStore()
    const idsContas = contasSelecionadas.map(c => c.id)

    const { data: cartoes = [] } = useCartoes()

    const { data = [], isFetching } = useQuery({
        queryKey: [
            "lancamentos",
            idsContas,
            mesSelecionado,
            anoSelecionado,
            cartoes?.length
        ],
        queryFn: async () => {
            const lancamentos = await getLancamentosFilter({
                idsContas,
                mes: mesSelecionado,
                ano: anoSelecionado
            })

            // Se não houver mês/ano, retorna só os lançamentos
            if (mesSelecionado === null || anoSelecionado === null) return lancamentos

            // Gerar linhas fictícias para faturas de cartão
            const faturasPromises = cartoes
                .filter(c => {
                    // Se houver contas selecionadas, filtrar cartões vinculados a elas
                    if (idsContas.length > 0) {
                        return c.id_conta && idsContas.includes(c.id_conta)
                    }
                    return true
                })
                .map(async (c) => {
                    const lCartao = await getLancamentosCartao({
                        cartaoId: c.id,
                        mes: mesSelecionado,
                        ano: anoSelecionado,
                        diaFechamento: c.dia_fechamento || 10
                    })

                    if (lCartao.length === 0) return null

                    const total = lCartao.reduce((acc, l) => acc + l.valor, 0)
                    const todosPagos = lCartao.every(l => l.pago)

                    return {
                        id: `fatura-${c.id}`,
                        descricao: `Fatura ${c.nome}`,
                        valor: total,
                        data: `${anoSelecionado}-${String(mesSelecionado).padStart(2, '0')}-${String(c.dia_vencimento || 10).padStart(2, '0')}`,
                        pago: todosPagos,
                        isFatura: true,
                        cartao: c,
                        conta_id: c.id_conta
                    }
                })

            const faturas = (await Promise.all(faturasPromises)).filter(Boolean) as any[]

            // Unir e ordenar por data decrescente
            return [...lancamentos, ...faturas].sort((a, b) => {
                const dateA = new Date(a.data).getTime()
                const dateB = new Date(b.data).getTime()
                return dateB - dateA
            })
        },
        enabled: idsContas.length > 0 &&
            mesSelecionado !== null &&
            anoSelecionado !== null,
        placeholderData: (prev) => prev
    })

    return (
        <>
            <DialogLancamento open={open} onOpenChange={setOpen} />
            <DialogFaturaCartao 
                cartao={selectedCartaoFatura} 
                open={!!selectedCartaoFatura} 
                onOpenChange={(v) => !v && setSelectedCartaoFatura(null)} 
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mx-5 mt-6 mb-4">
                <div className="w-full sm:w-auto">
                    <ComponenteContas />
                </div>
                <Button 
                    className="w-full sm:w-auto shadow-sm" 
                    onClick={() => setOpen(true)}
                >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Adicionar Lançamento
                </Button>
            </div>

            <div className="flex justify-center mx-5 mb-2">
                <div className="w-full sm:w-auto flex justify-center">
                    <ComponenteMesAno />
                </div>
            </div>

            {isFetching ? (
                <p className="text-sm text-muted-foreground mx-5">Atualizando filtros...</p>
            ) : (
                <DataTable 
                    columns={columns} 
                    data={data} 
                    idsContas={idsContas}
                    onFaturaClick={(cartao) => setSelectedCartaoFatura(cartao)}
                />
            )}
            <ResumoFinanceiro data={data} />
        </>
    )
}