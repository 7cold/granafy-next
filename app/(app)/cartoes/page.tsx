"use client"

import { useState, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { useContas } from "@/services/contas"
import { Cartao, useCartoes, useAddCartao, useEditCartao, useToggleCartao, useDeleteCartao } from "@/services/cartoes"
import { useQueryClient } from "@tanstack/react-query"
import { Edit2Icon, EyeOffIcon, EyeIcon, PlusIcon, XIcon, CheckIcon, Search, TrashIcon, CreditCardIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DialogFaturaCartao } from "@/components/layout/dialog-fatura-cartao"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface CartaoFormData {
    nome: string
    id_conta: string
    dia_vencimento: string
    dia_fechamento: string
}

export default function CartoesPage() {
    const queryClient = useQueryClient()
    const { data: cartoes = [], isLoading } = useCartoes()
    const { data: contas = [] } = useContas()

    // Mutations
    const addCartao = useAddCartao()
    const editCartao = useEditCartao()
    const toggleCartao = useToggleCartao()
    const deleteCartao = useDeleteCartao()

    // States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [cartaoToDelete, setCartaoToDelete] = useState<Cartao | null>(null)
    const [cartaoFatura, setCartaoFatura] = useState<Cartao | null>(null)

    // Dias de Vencimento
    const diasVencimento = Array.from({ length: 28 }, (_, i) => i + 1)

    //create form
    const {
        register: registerAdd,
        handleSubmit: handleSubmitAdd,
        reset: resetAdd,
        control: controlAdd,
        formState: { errors: errorsAdd },
    } = useForm<CartaoFormData>({
        defaultValues: {
            nome: "",
            id_conta: "",
            dia_vencimento: "",
        },
    })

    //edit form
    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
        control: controlEdit,
        formState: { errors: errorsEdit },
    } = useForm<CartaoFormData>({
        defaultValues: {
            nome: "",
            id_conta: "",
            dia_vencimento: "",
        },
    })

    // Filtrar e ordenar cartões
    const filteredCartoes = useMemo(() => {
        return (cartoes as Cartao[])
            .filter(cartao =>
                cartao.nome?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                return (a.nome || '').localeCompare(b.nome || '')
            })
    }, [cartoes, searchQuery])

    const onAddSubmit = async (data: CartaoFormData) => {
        try {
            await addCartao.mutateAsync({
                nome: data.nome,
                id_conta: Number(data.id_conta),
                dia_vencimento: Number(data.dia_vencimento),
                dia_fechamento: Number(data.dia_fechamento),
            })

            toast.success("Cartão criado com sucesso!")

            resetAdd()
            setIsAddDialogOpen(false)
            queryClient.invalidateQueries({ queryKey: ["cartoes"] })
        } catch (error) {
            toast.error("Não foi possível criar o cartão")
        }
    }

    const onEditSubmit = async (data: CartaoFormData) => {
        if (!editingId) return

        try {
            await editCartao.mutateAsync({
                id: editingId,
                updates: {
                    nome: data.nome,
                    id_conta: Number(data.id_conta),
                    dia_vencimento: Number(data.dia_vencimento),
                    dia_fechamento: Number(data.dia_fechamento),
                },
            })

            toast.success("Cartão atualizado com sucesso!")

            setEditingId(null)
            resetEdit()
            queryClient.invalidateQueries({ queryKey: ["cartoes"] })
        } catch (error) {
            toast.error("Não foi possível atualizar o cartão")
        }
    }

    const handleToggleCartao = async (cartaoId: number, currentStatus: boolean | null) => {
        try {
            await toggleCartao.mutateAsync({
                id: cartaoId,
                ativo: !currentStatus,
            })
            toast.success(`Cartão ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`)
            queryClient.invalidateQueries({ queryKey: ["cartoes"] })
        } catch (error) {
            toast.error("Não foi possível alterar o status do cartão")
        }
    }

    const startEdit = (cartao: Cartao) => {
        setEditingId(cartao.id)
        resetEdit({
            nome: cartao.nome || "",
            id_conta: cartao.id_conta?.toString() || "",
            dia_vencimento: cartao.dia_vencimento?.toString() || "",
            dia_fechamento: cartao.dia_fechamento?.toString() || "",
        })
    }

    const cancelEdit = () => {
        setEditingId(null)
        resetEdit()
    }

    const handleDeleteCartao = async () => {
        if (!cartaoToDelete) return
        try {
            await deleteCartao.mutateAsync(cartaoToDelete.id)
            toast.success("Cartão e lançamentos vinculados excluídos com sucesso!")
            setCartaoToDelete(null)
            queryClient.invalidateQueries({ queryKey: ["cartoes"] })
            queryClient.invalidateQueries({ queryKey: ["lancamentos"] })
        } catch (error) {
            toast.error("Não foi possível excluir o cartão")
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="text-lg">Carregando cartões...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Novo Cartão
                    </Button>
                </div>

                {/* Search Card */}
                <Card>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Pesquisar cartões..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Cartões */}
                <Card>
                    <CardHeader>
                        <CardTitle>Seus Cartões</CardTitle>
                        <CardDescription>
                            {filteredCartoes.length} {filteredCartoes.length === 1 ? 'cartão encontrado' : 'cartões encontrados'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {filteredCartoes.length === 0 ? (
                            <Alert>
                                <AlertDescription>
                                    {searchQuery ? (
                                        "Nenhum cartão encontrado com esse termo de busca."
                                    ) : (
                                        <div className="text-center">
                                            <p>Nenhum cartão cadastrado ainda.</p>
                                            <Button
                                                variant="link"
                                                onClick={() => setIsAddDialogOpen(true)}
                                            >
                                                Criar primeiro cartão
                                            </Button>
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        ) : (
                            filteredCartoes.map((cartao) => (
                                <Card key={cartao.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setCartaoFatura(cartao)}>
                                    <CardContent>
                                        {editingId === cartao.id ? (
                                            // Modo Edição
                                            <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-name">Últimos 4 Dígitos *</Label>
                                                    <Input
                                                        id="edit-name"
                                                        type="text"
                                                        maxLength={4}
                                                        {...registerEdit("nome", {
                                                            required: "Dígitos são obrigatórios",
                                                            pattern: {
                                                                value: /^[0-9]{4}$/,
                                                                message: "Deve conter exatamente 4 números"
                                                            }
                                                        })}
                                                    />
                                                    {errorsEdit.nome && (
                                                        <p className="text-red-500 text-sm">{errorsEdit.nome.message}</p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Conta Vinculada *</Label>
                                                    <Controller
                                                        name="id_conta"
                                                        control={controlEdit}
                                                        rules={{ required: "Conta vinculada é obrigatória" }}
                                                        render={({ field: { onChange, value } }) => (
                                                            <Select value={value} onValueChange={onChange}>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione a Conta" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectGroup>
                                                                        <SelectLabel>Contas Ativas</SelectLabel>
                                                                        {contas?.filter((e) => e.ativo).map((conta) => (
                                                                            <SelectItem key={conta.id} value={conta.id.toString()}>
                                                                                {conta.nome}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                    {errorsEdit.id_conta && (
                                                        <p className="text-red-500 text-sm">{errorsEdit.id_conta.message}</p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Dia do Vencimento *</Label>
                                                    <Controller
                                                        name="dia_vencimento"
                                                        control={controlEdit}
                                                        rules={{ required: "Dia do vencimento é obrigatório" }}
                                                        render={({ field: { onChange, value } }) => (
                                                            <Select value={value} onValueChange={onChange}>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione o Dia" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectGroup>
                                                                        <SelectLabel>Dias (1 a 28)</SelectLabel>
                                                                        {diasVencimento.map((dia) => (
                                                                            <SelectItem key={dia} value={dia.toString()}>
                                                                                Dia {dia}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                    {errorsEdit.dia_vencimento && (
                                                        <p className="text-red-500 text-sm">{errorsEdit.dia_vencimento.message}</p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Dia de Fechamento *</Label>
                                                    <Controller
                                                        name="dia_fechamento"
                                                        control={controlEdit}
                                                        rules={{ required: "Dia de fechamento é obrigatório" }}
                                                        render={({ field: { onChange, value } }) => (
                                                            <Select value={value} onValueChange={onChange}>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione o Dia" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectGroup>
                                                                        <SelectLabel>Dias (1 a 28)</SelectLabel>
                                                                        {diasVencimento.map((dia) => (
                                                                            <SelectItem key={`fech-${dia}`} value={dia.toString()}>
                                                                                Dia {dia}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                    {errorsEdit.dia_fechamento && (
                                                        <p className="text-red-500 text-sm">{errorsEdit.dia_fechamento.message}</p>
                                                    )}
                                                </div>

                                                <div className="flex gap-3 mt-4">
                                                    <Button type="submit" disabled={editCartao.isPending}>
                                                        <CheckIcon className="mr-2 h-4 w-4" />
                                                        {editCartao.isPending ? "Salvando..." : "Salvar"}
                                                    </Button>
                                                    <Button type="button" onClick={cancelEdit} variant="outline">
                                                        <XIcon className="mr-2 h-4 w-4" />
                                                        Cancelar
                                                    </Button>
                                                </div>
                                            </form>
                                        ) : (
                                            // Modo Visualização
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
                                                        <h3 className="text-lg font-semibold">
                                                            Cartão final {cartao.nome}
                                                        </h3>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        Conta vinculada: {contas.find(c => c.id === cartao.id_conta)?.nome || "Não encontrada"} <br/>
                                                        Fechamento: Dia {cartao.dia_fechamento} | Vencimento: Dia {cartao.dia_vencimento}
                                                    </div>
                                                    {cartao.ativo === false && (
                                                        <Badge variant="destructive" className="mt-2">
                                                            Desativado
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                                                    <Button onClick={() => startEdit(cartao)} variant="ghost" size="icon" title="Editar cartão">
                                                        <Edit2Icon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleToggleCartao(cartao.id, cartao.ativo)}
                                                        disabled={toggleCartao.isPending}
                                                        variant="ghost"
                                                        size="icon"
                                                        title={cartao.ativo === false ? "Ativar cartão" : "Desativar cartão"}
                                                    >
                                                        {cartao.ativo === false ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        onClick={() => setCartaoToDelete(cartao)}
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Excluir cartão"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Dialog para Adicionar Novo Cartão */}
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    if (!open) resetAdd()
                    setIsAddDialogOpen(open)
                }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Cartão</DialogTitle>
                            <DialogDescription>
                                Preencha os dados do novo cartão abaixo.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Últimos 4 Dígitos *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    maxLength={4}
                                    {...registerAdd("nome", {
                                        required: "Dígitos são obrigatórios",
                                        pattern: {
                                            value: /^[0-9]{4}$/,
                                            message: "Deve conter exatamente 4 números"
                                        }
                                    })}
                                    placeholder="Ex: 1234"
                                />
                                {errorsAdd.nome && (
                                    <p className="text-red-500 text-sm">{errorsAdd.nome.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Conta Vinculada *</Label>
                                <Controller
                                    name="id_conta"
                                    control={controlAdd}
                                    rules={{ required: "Conta vinculada é obrigatória" }}
                                    render={({ field: { onChange, value } }) => (
                                        <Select value={value} onValueChange={onChange}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecione a Conta" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Contas Ativas</SelectLabel>
                                                    {contas?.filter((e) => e.ativo).map((conta) => (
                                                        <SelectItem key={conta.id} value={conta.id.toString()}>
                                                            {conta.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errorsAdd.id_conta && (
                                    <p className="text-red-500 text-sm">{errorsAdd.id_conta.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Dia do Vencimento *</Label>
                                <Controller
                                    name="dia_vencimento"
                                    control={controlAdd}
                                    rules={{ required: "Dia do vencimento é obrigatório" }}
                                    render={({ field: { onChange, value } }) => (
                                        <Select value={value} onValueChange={onChange}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecione o Dia" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Dias (1 a 28)</SelectLabel>
                                                    {diasVencimento.map((dia) => (
                                                        <SelectItem key={dia} value={dia.toString()}>
                                                            Dia {dia}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errorsAdd.dia_vencimento && (
                                    <p className="text-red-500 text-sm">{errorsAdd.dia_vencimento.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Dia de Fechamento *</Label>
                                <Controller
                                    name="dia_fechamento"
                                    control={controlAdd}
                                    rules={{ required: "Dia de fechamento é obrigatório" }}
                                    render={({ field: { onChange, value } }) => (
                                        <Select value={value} onValueChange={onChange}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecione o Dia" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Dias (1 a 28)</SelectLabel>
                                                    {diasVencimento.map((dia) => (
                                                        <SelectItem key={`fech-${dia}`} value={dia.toString()}>
                                                            Dia {dia}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errorsAdd.dia_fechamento && (
                                    <p className="text-red-500 text-sm">{errorsAdd.dia_fechamento.message}</p>
                                )}
                            </div>

                            <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddDialogOpen(false)
                                        resetAdd()
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={addCartao.isPending}>
                                    <CheckIcon className="mr-2 h-4 w-4" />
                                    {addCartao.isPending ? "Salvando..." : "Salvar"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal de Exclusão */}
                <Dialog open={!!cartaoToDelete} onOpenChange={(open) => !open && setCartaoToDelete(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Excluir Cartão</DialogTitle>
                            <DialogDescription>
                                Tem certeza que deseja excluir o cartão final <strong className="text-foreground">{cartaoToDelete?.nome}</strong>?
                                <br /><br />
                                <span className="text-destructive font-semibold">
                                    Atenção: Isso irá apagar permanentemente todos os lançamentos vinculados a este cartão.
                                </span>
                                <br /><br />
                                Esta ação não poderá ser desfeita.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCartaoToDelete(null)}>
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteCartao}
                                disabled={deleteCartao.isPending}
                            >
                                {deleteCartao.isPending ? "Excluindo..." : "Sim, Excluir Cartão"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog da Fatura do Cartão */}
                <DialogFaturaCartao
                    cartao={cartaoFatura}
                    open={!!cartaoFatura}
                    onOpenChange={(open) => !open && setCartaoFatura(null)}
                />
            </div>
        </div>
    )
}