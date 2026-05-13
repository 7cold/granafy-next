import { useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription, FieldContent, FieldTitle } from "@/components/ui/field"
import { Controller, useForm } from "react-hook-form"
import { NumericFormat } from "react-number-format"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PopoverTrigger, PopoverContent, Popover } from "@/components/ui/popover"
import { ChevronDownIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { useContas } from "@/services/contas"
import { useCategorias } from "@/services/categorias"
import { useCartoes } from "@/services/cartoes"
import { toast } from "sonner"
import { updateLancamento } from "@/services/lancamentos"
import { useQueryClient } from "@tanstack/react-query"

type DialogEditarLancamentoProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    lancamento: any
}

export function DialogEditarLancamento({ open, onOpenChange, lancamento }: DialogEditarLancamentoProps) {
    const queryClient = useQueryClient()
    const { data: categorias } = useCategorias()
    const { data: contas } = useContas()
    const { data: cartoes } = useCartoes()
    const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm();
    const tipoSelecionado = watch("tipo")

    useEffect(() => {
        if (open && lancamento) {
            reset({
                ...lancamento,
                data: lancamento.data ? new Date(lancamento.data) : new Date(),
                categoria_id: lancamento.categoria_id?.toString() || "",
                conta_id: lancamento.conta_id?.toString() || "",
                id_cartao: lancamento.id_cartao?.toString() || "",
            });
        }
    }, [open, lancamento, reset]);

    function onSubmit(data: any) {
        if (!lancamento?.id) {
            toast.error("Erro: ID do lançamento não encontrado.")
            return
        }

        const payload = {
            ...data,
            id: lancamento.id,
            data: data.data ? new Date(data.data).toISOString() : null,
        }
        updateLancamento(payload)
            .then(() => {
                toast.success("Lançamento atualizado com sucesso!")
                queryClient.invalidateQueries({
                    queryKey: ["lancamentos"]
                })
                queryClient.invalidateQueries({
                    queryKey: ["lancamentos-cartao"]
                })
                onOpenChange(false)
            })
            .catch((err) => {
                toast.error("Erro ao atualizar lançamento: " + err.message)
            })
    }
    return (
        <AlertDialog
            open={open}
            onOpenChange={(openState) => {
                if (!openState) {
                    reset() // Limpa o form ao fechar
                }
                onOpenChange(openState)
            }}
        >
            <AlertDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-130">
                <AlertDialogHeader>
                    <AlertDialogTitle>Editar Lançamento</AlertDialogTitle>
                    <AlertDialogDescription>
                        Altere os dados abaixo para atualizar o lançamento.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4">
                        <Field>
                            <FieldLabel>Descrição</FieldLabel>
                            <Input type="text" placeholder="Descrição do lançamento" {...register("descricao", { required: false })} />
                        </Field>

                        <Field>
                            <FieldLabel>Valor</FieldLabel>
                            <Controller
                                name="valor"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        value={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(field.value || 0))}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/\D/g, "");
                                            const cents = parseInt(rawValue || "0", 10);
                                            field.onChange(cents / 100);
                                        }}
                                        className="text-left font-mono"
                                        placeholder="0,00"
                                    />
                                )}
                            />
                        </Field>
                        <Controller
                            name="tipo"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Tabs value={value} onValueChange={(val) => {
                                    onChange(val);
                                }} >
                                    <TabsList>
                                        <TabsTrigger value="despesa">Despesa</TabsTrigger>
                                        <TabsTrigger value="receita">Receita</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            )}
                        />
                        <Controller
                            name="categoria_id"
                            control={control}
                            rules={{ required: "Selecione a categoria" }}
                            render={({ field: { onChange, value } }) => (
                                <Select value={value} onValueChange={(val) => {
                                    onChange(val);
                                }}>
                                    <SelectTrigger className="w-full max-w-100">
                                        <SelectValue placeholder="Selecione a Categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Categorias</SelectLabel>
                                            {categorias?.filter((e) => e.ativo == true && e.tipo == (tipoSelecionado ?? "despesa"))
                                                .sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? ""))
                                                .map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                                        {cat.nome}
                                                    </SelectItem>
                                                ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {lancamento?.id_cartao ? (
                            <Controller
                                name="id_cartao"
                                rules={{ required: "Selecione o Cartão" }}
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <Select value={value} onValueChange={onChange}>
                                        <SelectTrigger className="w-full max-w-100">
                                            <SelectValue placeholder="Selecione o Cartão" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Cartões</SelectLabel>
                                                {cartoes?.map((cartao: any) => (
                                                    <SelectItem key={cartao.id} value={cartao.id.toString()}>
                                                        Cartão final {cartao.nome}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        ) : (
                            <Controller
                                name="conta_id"
                                rules={{ required: "Selecione a Conta" }}
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <Select value={value} onValueChange={(val) => {
                                        onChange(val);
                                    }}>
                                        <SelectTrigger className="w-full max-w-100">
                                            <SelectValue placeholder="Selecione a Conta" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Contas</SelectLabel>
                                                {contas?.map((conta) => (
                                                    <SelectItem key={conta.id} value={conta.id.toString()}>
                                                        {conta.nome}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        )}
                        <FieldLabel>
                            <Field orientation="horizontal">
                                <Controller
                                    name="pago"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox checked={field.value}
                                            onCheckedChange={(val) => field.onChange(!!val)} />
                                    )}
                                />
                                <FieldContent>
                                    <FieldTitle>{tipoSelecionado === "receita" ? "Receita Recebida" : "Despesa Paga"}</FieldTitle>
                                    <FieldDescription>
                                        {tipoSelecionado === "receita"
                                            ? "Caso já tenha recebido o valor, marque esta opção."
                                            : "Caso já tenha efetuado o pagamento, marque esta opção."}
                                    </FieldDescription>
                                </FieldContent>
                            </Field>
                        </FieldLabel>
                        <Controller
                            name="data"
                            control={control}
                            rules={{ required: "Selecione a Data" }}
                            render={({ field }) => (
                                <Popover >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            data-empty={!field.value}
                                            className="w-full max-w-100 justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
                                        >
                                            {field.value
                                                ? format(
                                                    new Date(field.value.getUTCFullYear(), field.value.getUTCMonth(), field.value.getUTCDate()),
                                                    "PPP",
                                                    { locale: ptBR }
                                                )
                                                : <span>Selecione a Data</span>}
                                            <ChevronDownIcon />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent >
                                        <Calendar
                                            mode="single"
                                            selected={
                                                field.value
                                                    ? new Date(new Date(field.value).setHours(12, 0, 0, 0))
                                                    : undefined
                                            }
                                            onSelect={(d) => {
                                                if (!d) return field.onChange(null)
                                                // força meio-dia local para evitar deslocamento de timezone
                                                const adjusted = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)
                                                field.onChange(adjusted)
                                            }}
                                            className="rounded-lg border"
                                            captionLayout="dropdown"
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit">Salvar Alterações</Button>
                        </div>
                    </div>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    )
}