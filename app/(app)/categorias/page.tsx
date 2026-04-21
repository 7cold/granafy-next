"use client"

import { useState, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { Categoria, useCategorias, useAddCategoria, useEditCategoria, useToggleCategoria } from "@/services/categorias"
import { useQueryClient } from "@tanstack/react-query"
import { Edit2Icon, EyeOffIcon, EyeIcon, PlusIcon, XIcon, CheckIcon, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CategoriaFormData {
    nome: string
    tipo: string
}

export default function CategoriasPage() {
    const queryClient = useQueryClient()
    const { data: categorias = [], isLoading } = useCategorias()

    // Mutations
    const addCategoria = useAddCategoria()
    const editCategoria = useEditCategoria()
    const toggleCategoria = useToggleCategoria()

    // States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState("")


    //create form
    const {
        register: registerAdd,
        handleSubmit: handleSubmitAdd,
        reset: resetAdd,
        control: controlAdd,
        formState: { errors: errorsAdd },
    } = useForm<CategoriaFormData>({
        defaultValues: {
            nome: "",
            tipo: "",
        },
    })

    //edit form
    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
        control: controlEdit,
        formState: { errors: errorsEdit },
    } = useForm<CategoriaFormData>({
        defaultValues: {
            nome: "",
            tipo: "",
        },
    })

    // Filtrar e ordenar categorias
    const filteredCategorias = useMemo(() => {
        return (categorias as Categoria[])
            .filter(cat =>
                cat.nome?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                // Primeiro: ordenar por tipo (despesa antes de receita)
                if (a.tipo === 'despesa' && b.tipo === 'receita') return -1
                if (a.tipo === 'receita' && b.tipo === 'despesa') return 1

                // Segundo: ordenar alfabeticamente por nome
                return (a.nome || '').localeCompare(b.nome || '')
            })
    }, [categorias, searchQuery])

    const onAddSubmit = async (data: CategoriaFormData) => {
        try {
            await addCategoria.mutateAsync({
                nome: data.nome,
                tipo: data.tipo || undefined,
            })

            toast.success("Categoria criada com sucesso!")

            resetAdd()
            setIsAddDialogOpen(false)
            queryClient.invalidateQueries({ queryKey: ["categorias"] })
        } catch (error) {
            toast.error("Não foi possível criar a categoria")
        }
    }

    const onEditSubmit = async (data: CategoriaFormData) => {
        if (!editingId) return

        try {
            await editCategoria.mutateAsync({
                id: editingId,
                updates: {
                    nome: data.nome,
                    tipo: data.tipo || undefined,
                },
            })

            toast.success("Categoria atualizada com sucesso!")

            setEditingId(null)
            resetEdit()
            queryClient.invalidateQueries({ queryKey: ["categorias"] })
        } catch (error) {
            toast.error("Não foi possível atualizar a categoria")
        }
    }

    const handleToggleCategory = async (categoriaId: number, currentStatus: boolean | null) => {
        try {
            await toggleCategoria.mutateAsync({
                id: categoriaId,
                ativo: !currentStatus,
            })
            toast.success(`Categoria ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`)
            queryClient.invalidateQueries({ queryKey: ["categorias"] })
        } catch (error) {
            toast.error("Não foi possível alterar o status da categoria")
        }
    }

    const startEdit = (categoria: Categoria) => {
        setEditingId(categoria.id)
        resetEdit({
            nome: categoria.nome || "",
            tipo: categoria.tipo || "",
        })
    }

    const cancelEdit = () => {
        setEditingId(null)
        resetEdit()
    }

    // Função para retornar o badge de tipo
    const getTipoBadge = (tipo: string | null) => {
        if (tipo === 'receita') {
            return <Badge className="bg-green-500 hover:bg-green-600">Receita</Badge>
        }
        if (tipo === 'despesa') {
            return <Badge className="bg-red-500 hover:bg-red-600">Despesa</Badge>
        }
        return null
    }

    if (isLoading) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="text-lg">Carregando categorias...</div>
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
                        Nova Categoria
                    </Button>
                </div>

                {/* Search Card */}
                <Card>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Pesquisar categorias..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Categorias */}
                <Card>
                    <CardHeader>
                        <CardTitle>Suas Categorias</CardTitle>
                        <CardDescription>
                            {filteredCategorias.length} {filteredCategorias.length === 1 ? 'categoria' : 'categorias'} {searchQuery && 'encontrada(s)'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {filteredCategorias.length === 0 ? (
                            <Alert>
                                <AlertDescription>
                                    {searchQuery ? (
                                        "Nenhuma categoria encontrada com esse termo de busca."
                                    ) : (
                                        <div className="text-center">
                                            <p>Nenhuma categoria cadastrada ainda.</p>
                                            <Button
                                                variant="link"
                                                onClick={() => setIsAddDialogOpen(true)}
                                            >
                                                Criar primeira categoria
                                            </Button>
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        ) : (
                            filteredCategorias.map((categoria) => (
                                <Card key={categoria.id}>
                                    <CardContent>
                                        {editingId === categoria.id ? (
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
                                                    <Label htmlFor="edit-tipo">
                                                        Tipo *
                                                    </Label>
                                                    <Controller
                                                        name="tipo"
                                                        control={controlEdit}
                                                        rules={{ required: "Tipo é obrigatório" }}
                                                        render={({ field }) => (
                                                            <Select
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                            >
                                                                <SelectTrigger id="edit-tipo">
                                                                    <SelectValue placeholder="Selecione o tipo" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="despesa">Despesa</SelectItem>
                                                                    <SelectItem value="receita">Receita</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                    {errorsEdit.tipo && (
                                                        <p className="text-red-500 text-sm">{errorsEdit.tipo.message}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button
                                                        type="submit"
                                                        disabled={editCategoria.isPending}
                                                    >
                                                        <CheckIcon className="mr-2 h-4 w-4" />
                                                        {editCategoria.isPending ? "Salvando..." : "Salvar"}
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
                                                        <h3 className="text-lg font-semibold">
                                                            {categoria.nome}
                                                        </h3>
                                                        {getTipoBadge(categoria.tipo)}
                                                    </div>
                                                    {categoria.ativo === false && (
                                                        <Badge variant="destructive" className="mt-2">
                                                            Desativada
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Button
                                                        onClick={() => startEdit(categoria)}
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Editar categoria"
                                                    >
                                                        <Edit2Icon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleToggleCategory(categoria.id, categoria.ativo)}
                                                        disabled={toggleCategoria.isPending}
                                                        variant="ghost"
                                                        size="icon"
                                                        title={categoria.ativo === false ? "Ativar categoria" : "Desativar categoria"}
                                                    >
                                                        {categoria.ativo === false ? (
                                                            <EyeIcon className="h-4 w-4" />
                                                        ) : (
                                                            <EyeOffIcon className="h-4 w-4" />
                                                        )}
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

                {/* Dialog para Adicionar Nova Categoria */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Nova Categoria</DialogTitle>
                            <DialogDescription>
                                Preencha os dados da nova categoria abaixo.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nome da Categoria *
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    {...registerAdd("nome", {
                                        required: "Nome é obrigatório",
                                        minLength: { value: 2, message: "Mínimo de 2 caracteres" }
                                    })}
                                    placeholder="Digite o nome da categoria"
                                />
                                {errorsAdd.nome && (
                                    <p className="text-red-500 text-sm">{errorsAdd.nome.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tipo">
                                    Tipo *
                                </Label>
                                <Controller
                                    name="tipo"
                                    control={controlAdd}
                                    rules={{ required: "Tipo é obrigatório" }}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger id="tipo">
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="despesa">Despesa</SelectItem>
                                                <SelectItem value="receita">Receita</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errorsAdd.tipo && (
                                    <p className="text-red-500 text-sm">{errorsAdd.tipo.message}</p>
                                )}
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
                                    disabled={addCategoria.isPending}
                                >
                                    <CheckIcon className="mr-2 h-4 w-4" />
                                    {addCategoria.isPending ? "Salvando..." : "Salvar"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}