"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CheckIcon, TrashIcon } from "lucide-react"
import { Cartao } from "@/services/cartoes"
import { getLancamentosCartao, pagarFaturaCartao } from "@/services/lancamentos"
import { useCategorias } from "@/services/categorias"
import { toast } from "sonner"
import { DialogLancamento } from "./dialog-lancamento"
import { DialogEditarLancamento } from "./dialog-editar"
import { DialogDeleteLancamento } from "./dialog-delete-lancamento"
import { Badge } from "@/components/ui/badge"

interface DialogFaturaCartaoProps {
    cartao: Cartao | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DialogFaturaCartao({ cartao, open, onOpenChange }: DialogFaturaCartaoProps) {
    const queryClient = useQueryClient()
    const { data: categorias } = useCategorias()
    const [currentDate, setCurrentDate] = useState(() => addMonths(new Date(), 1))

    useEffect(() => {
        if (open) {
            setCurrentDate(addMonths(new Date(), 1))
        }
    }, [open])

    const [isLancamentoOpen, setIsLancamentoOpen] = useState(false)
    const [editingLancamento, setEditingLancamento] = useState<any | null>(null)
    const [deletingLancamento, setDeletingLancamento] = useState<any | null>(null)

    const mes = currentDate.getMonth() + 1
    const ano = currentDate.getFullYear()

    const { data: lancamentos = [], isLoading, refetch } = useQuery({
        queryKey: ["lancamentos-cartao", cartao?.id, mes, ano],
        queryFn: () => getLancamentosCartao({
            cartaoId: cartao!.id,
            mes,
            ano,
            diaFechamento: cartao!.dia_fechamento || 1, // Fallback se null
        }),
        enabled: !!cartao && open,
    })

    const pagarFaturaMutation = useMutation({
        mutationFn: () => pagarFaturaCartao({
            cartaoId: cartao!.id,
            mes,
            ano,
            diaFechamento: cartao!.dia_fechamento || 1,
        }),
        onSuccess: () => {
            toast.success("Fatura paga com sucesso!")
            queryClient.invalidateQueries({ queryKey: ["lancamentos-cartao"] })
            queryClient.invalidateQueries({ queryKey: ["lancamentos"] })
        },
        onError: () => {
            toast.error("Erro ao pagar a fatura")
        }
    })

    const totalFatura = lancamentos.reduce((acc, l) => acc + (l.valor || 0), 0)
    const todosPagos = lancamentos.length > 0 && lancamentos.every(l => l.pago)

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

    if (!cartao) return null

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[80vw] w-[80vw] sm:max-w-[80vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Fatura - Cartão final {cartao.nome}</DialogTitle>
                        <DialogDescription>
                            Fechamento: Dia {cartao.dia_fechamento} | Vencimento: Dia {cartao.dia_vencimento}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Navegação de Meses e Ações */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={prevMonth}>
                                <ChevronLeftIcon className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-semibold capitalize min-w-[120px] text-center">
                                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                            </span>
                            <Button variant="outline" size="icon" onClick={nextMonth}>
                                <ChevronRightIcon className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsLancamentoOpen(true)}
                            >
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Lançamento
                            </Button>
                            <Button
                                onClick={() => pagarFaturaMutation.mutate()}
                                disabled={pagarFaturaMutation.isPending || lancamentos.length === 0 || todosPagos}
                            >
                                <CheckIcon className="mr-2 h-4 w-4" />
                                Pagar Fatura
                            </Button>
                        </div>
                    </div>

                    {/* Resumo */}
                    <div className="p-4 bg-muted/30 rounded-lg flex items-center justify-between border mt-4">
                        <span className="text-sm font-medium">Total da Fatura</span>
                        <span className={`text-lg font-bold ${totalFatura < 0 ? "text-red-500" : "text-green-500"}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(totalFatura))}
                        </span>
                    </div>

                    {/* Lista de Lançamentos */}
                    <div className="mt-4 space-y-3">
                        {isLoading ? (
                            <div className="text-center py-4 text-muted-foreground">Carregando lançamentos...</div>
                        ) : lancamentos.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                                Nenhum lançamento nesta fatura.
                            </div>
                        ) : (
                            lancamentos.map((lancamento) => {
                                const categoriaNome = categorias?.find(c => c.id === lancamento.categoria_id)?.nome || "Sem categoria"
                                return (
                                    <div
                                        key={lancamento.id}
                                        className="flex items-center justify-between p-3 border rounded-lg bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => setEditingLancamento(lancamento)}
                                    >
                                        <div>
                                            <p className="font-medium">{lancamento.descricao}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {categoriaNome}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {format(new Date(lancamento.data), "dd 'de' MMM", { locale: ptBR })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-semibold ${lancamento.valor < 0 ? "text-black-500" : "text-green-500"}`}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(lancamento.valor))}
                                            </span>
                                            {lancamento.pago ? (
                                                <Badge variant="default" className="bg-green-500">Pago</Badge>
                                            ) : (
                                                <Badge variant="secondary">Pendente</Badge>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeletingLancamento(lancamento);
                                                }}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Novo Lançamento para este cartão */}
            {isLancamentoOpen && (
                <DialogLancamento
                    open={isLancamentoOpen}
                    onOpenChange={(v) => {
                        setIsLancamentoOpen(v)
                        if (!v) refetch() // Atualiza a lista ao fechar
                    }}
                    modo="cartao"
                    defaultCartaoId={cartao.id}
                />
            )}

            {/* Modal de Edição de Lançamento */}
            {editingLancamento && (
                <DialogEditarLancamento
                    open={!!editingLancamento}
                    onOpenChange={(v) => {
                        if (!v) setEditingLancamento(null)
                        refetch() // Atualiza a lista caso algo tenha sido salvo
                    }}
                    lancamento={editingLancamento}
                />
            )}

            {/* Modal de Exclusão de Lançamento */}
            {deletingLancamento && (
                <DialogDeleteLancamento
                    open={!!deletingLancamento}
                    onOpenChange={(v) => {
                        if (!v) setDeletingLancamento(null)
                        refetch() // Atualiza a lista após exclusão
                    }}
                    lancamentoId={deletingLancamento.id}
                    temParcelamento={!!deletingLancamento.id_parcelamento}
                    idParcelamento={deletingLancamento.id_parcelamento}
                    idRecorrencia={deletingLancamento.id_recorrencia}
                />
            )}
        </>
    )
}
