"use client"

import { useState, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { Conta, useContas, useAddConta, useEditConta, useToggleConta, useDeleteConta } from "@/services/contas"
import { useQueryClient } from "@tanstack/react-query"
import { Edit2Icon, EyeOffIcon, EyeIcon, PlusIcon, XIcon, CheckIcon, Search, TrashIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface ContaFormData {
    nome: string
    cor?: string
}

export default function ContasPage() {
    const queryClient = useQueryClient()
    const { data: contas = [], isLoading } = useContas()

    // Mutations
    const addConta = useAddConta()
    const editConta = useEditConta()
    const toggleConta = useToggleConta()
    const deleteConta = useDeleteConta()

    // States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [contaToDelete, setContaToDelete] = useState<Conta | null>(null)

    //create form
    const {
        register: registerAdd,
        handleSubmit: handleSubmitAdd,
        reset: resetAdd,
        formState: { errors: errorsAdd },
    } = useForm<ContaFormData>({
        defaultValues: {
            nome: "",
            cor: "",
        },
    })

    //edit form
    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
        formState: { errors: errorsEdit },
    } = useForm<ContaFormData>({
        defaultValues: {
            nome: "",
            cor: "",
        },
    })

    // Filtrar e ordenar contas
    const filteredContas = useMemo(() => {
        return (contas as Conta[])
            .filter(conta =>
                conta.nome?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                // Ordenar alfabeticamente por nome
                return (a.nome || '').localeCompare(b.nome || '')
            })
    }, [contas, searchQuery])

    const onAddSubmit = async (data: ContaFormData) => {


        try {
            await addConta.mutateAsync({
                nome: data.nome,
                cor: data.cor || undefined,
                ativo: true
            })

            toast.success("Conta criada com sucesso!")

            resetAdd()
            setIsAddDialogOpen(false)
            queryClient.invalidateQueries({ queryKey: ["contas"] })
        } catch (error) {
            toast.error("Não foi possível criar a conta")
        }
    }

    const onEditSubmit = async (data: ContaFormData) => {
        if (!editingId) return

        try {
            await editConta.mutateAsync({
                id: editingId,
                updates: {
                    nome: data.nome,
                    cor: data.cor || undefined,
                },
            })

            toast.success("Conta atualizada com sucesso!")

            setEditingId(null)
            resetEdit()
            queryClient.invalidateQueries({ queryKey: ["contas"] })
        } catch (error) {
            toast.error("Não foi possível atualizar a conta")
        }
    }

    const handleToggleConta = async (contaId: number, currentStatus: boolean | null) => {
        try {
            await toggleConta.mutateAsync({
                id: contaId,
                ativo: !currentStatus,
            })
            toast.success(`Conta ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`)
            queryClient.invalidateQueries({ queryKey: ["contas"] })
        } catch (error) {
            toast.error("Não foi possível alterar o status da conta")
        }
    }

    const startEdit = (conta: Conta) => {
        setEditingId(conta.id)
        resetEdit({
            nome: conta.nome || "",
            cor: conta.cor || "",
        })
    }

    const cancelEdit = () => {
        setEditingId(null)
        resetEdit()
    }

    const handleDeleteConta = async () => {
        if (!contaToDelete) return
        try {
            await deleteConta.mutateAsync(contaToDelete.id)
            toast.success("Conta e lançamentos vinculados excluídos com sucesso!")
            setContaToDelete(null)
            queryClient.invalidateQueries({ queryKey: ["contas"] })
        } catch (error) {
            toast.error("Não foi possível excluir a conta")
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="text-lg">Carregando contas...</div>
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
                        Nova Conta
                    </Button>
                </div>

                {/* Search Card */}
                <Card>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Pesquisar contas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Contas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Suas Contas</CardTitle>
                        <CardDescription>
                            {filteredContas.length} {filteredContas.length === 1 ? 'conta' : 'contas'} {searchQuery && 'encontrada(s)'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {filteredContas.length === 0 ? (
                            <Alert>
                                <AlertDescription>
                                    {searchQuery ? (
                                        "Nenhuma conta encontrada com esse termo de busca."
                                    ) : (
                                        <div className="text-center">
                                            <p>Nenhuma conta cadastrada ainda.</p>
                                            <Button
                                                variant="link"
                                                onClick={() => setIsAddDialogOpen(true)}
                                            >
                                                Criar primeira conta
                                            </Button>
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        ) : (
                            filteredContas.map((conta) => (
                                <Card key={conta.id}>
                                    <CardContent>
                                        {editingId === conta.id ? (
                                            // Modo Edição
                                            <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-name">
                                                        Nome *
                                                    </Label>
                                                    <Input
                                                        id="edit-name"
                                                        type="text"
                                                        {...registerEdit("nome", {
                                                            required: "Nome é obrigatório",
                                                            minLength: { value: 2, message: "Mínimo de 2 caracteres" }
                                                        })}
                                                    />
                                                    {errorsEdit.nome && (
                                                        <p className="text-red-500 text-sm">{errorsEdit.nome.message}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-cor">
                                                        Cor (Opcional)
                                                    </Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="edit-cor"
                                                            type="color"
                                                            {...registerEdit("cor")}
                                                            className="w-20 h-10"
                                                        />

                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button
                                                        type="submit"
                                                        disabled={editConta.isPending}
                                                    >
                                                        <CheckIcon className="mr-2 h-4 w-4" />
                                                        {editConta.isPending ? "Salvando..." : "Salvar"}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        variant="outline"
                                                    >
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
                                                        {conta.cor && (
                                                            <div
                                                                className="w-4 h-4 rounded-full border"
                                                                style={{ backgroundColor: conta.cor }}
                                                            />
                                                        )}
                                                        <h3 className="text-lg font-semibold">
                                                            {conta.nome}
                                                        </h3>
                                                    </div>
                                                    {conta.ativo === false && (
                                                        <Badge variant="destructive" className="mt-2">
                                                            Desativada
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Button
                                                        onClick={() => startEdit(conta)}
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Editar conta"
                                                    >
                                                        <Edit2Icon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleToggleConta(conta.id, conta.ativo)}
                                                        disabled={toggleConta.isPending}
                                                        variant="ghost"
                                                        size="icon"
                                                        title={conta.ativo === false ? "Ativar conta" : "Desativar conta"}
                                                    >
                                                        {conta.ativo === false ? (
                                                            <EyeIcon className="h-4 w-4" />
                                                        ) : (
                                                            <EyeOffIcon className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        onClick={() => setContaToDelete(conta)}
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Excluir conta"
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

                {/* Dialog para Adicionar Nova Conta */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Nova Conta</DialogTitle>
                            <DialogDescription>
                                Preencha os dados da nova conta abaixo.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nome da Conta *
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    {...registerAdd("nome", {
                                        required: "Nome é obrigatório",
                                        minLength: { value: 2, message: "Mínimo de 2 caracteres" }
                                    })}
                                    placeholder="Digite o nome da conta"
                                />
                                {errorsAdd.nome && (
                                    <p className="text-red-500 text-sm">{errorsAdd.nome.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cor">
                                    Cor (Opcional)
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="cor"
                                        type="color"
                                        {...registerAdd("cor")}
                                        className="w-20 h-10"
                                    />

                                </div>
                            </div>
                            <DialogFooter>
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
                                <Button
                                    type="submit"
                                    disabled={addConta.isPending}
                                >
                                    <CheckIcon className="mr-2 h-4 w-4" />
                                    {addConta.isPending ? "Salvando..." : "Salvar"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal de Exclusão */}
                <Dialog open={!!contaToDelete} onOpenChange={(open) => !open && setContaToDelete(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Excluir Conta</DialogTitle>
                            <DialogDescription>
                                Tem certeza que deseja excluir a conta <strong className="text-foreground">{contaToDelete?.nome}</strong>?
                                <br /><br />
                                <span className="text-destructive font-semibold">
                                    Atenção: Isso irá apagar permanentemente todos os lançamentos vinculados a esta conta.
                                </span>
                                <br />
                                <br />
                                Esta ação não poderá ser desfeita.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setContaToDelete(null)}>
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteConta}
                                disabled={deleteConta.isPending}
                            >
                                {deleteConta.isPending ? "Excluindo..." : "Sim, Excluir Conta"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}