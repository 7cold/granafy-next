import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { toast } from "sonner"
import { createLancamento } from "@/services/lancamentos"
import { useMutation, useQueryClient } from "@tanstack/react-query"

type DialogLancamentoProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DialogLancamento({ open, onOpenChange }: DialogLancamentoProps) {
    const queryClient = useQueryClient()
    const { data: categorias } = useCategorias()
    const { data: contas } = useContas()

    const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
        defaultValues: {
            tipo: "despesa",
            descricao: "",
            valor: null,
            categoria_id: "",
            conta_id: "",
            pago: true,
            data: new Date(),
            parcelas: 1,
        }
    })

    const tipoSelecionado = watch("tipo")

    function onSubmit(data: any) {
        createLancamento(data).then(() => {
            toast.success("Lançamento cadastrado com sucesso!")
            reset()
            queryClient.invalidateQueries({ queryKey: ["lancamentos"] })
            onOpenChange(false)
        }).catch((err) => {
            toast.error("Erro ao cadastrar lançamento: " + err.message)
        })
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                if (!open) reset()
                onOpenChange(open)
            }}
        >
            {/* DialogContent já inclui botão X e fecha com ESC por padrão */}
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-130">
                <DialogHeader>
                    <DialogTitle>Cadastrar Lançamento</DialogTitle>
                    <DialogDescription>
                        Preencha os dados abaixo para cadastrar um novo lançamento.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4">
                        <Field>
                            <FieldLabel>Descrição</FieldLabel>
                            <Input type="text" placeholder="Descrição do lançamento" {...register("descricao")} />
                        </Field>

                        <Field>
                            <FieldLabel>Valor</FieldLabel>
                            <Controller
                                name="valor"
                                control={control}
                                render={({ field }) => (
                                    <NumericFormat
                                        name={field.name}
                                        value={field.value}
                                        getInputRef={field.ref}
                                        customInput={Input}
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        prefix="R$ "
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        placeholder="R$ 0,00"
                                        onValueChange={(values) => field.onChange(values.floatValue ?? null)}
                                    />
                                )}
                            />
                        </Field>

                        <Controller
                            name="tipo"
                            control={control}
                            render={({ field: { onChange } }) => (
                                <Tabs defaultValue="despesa" onValueChange={onChange}>
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
                            render={({ field: { onChange } }) => (
                                <Select onValueChange={onChange}>
                                    <SelectTrigger className="w-full max-w-100">
                                        <SelectValue placeholder="Selecione a Categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Categorias</SelectLabel>
                                            {categorias?.filter((e) => e.ativo && e.tipo === (tipoSelecionado ?? "despesa")).map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                                    {cat.nome}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />

                        <Controller
                            name="conta_id"
                            rules={{ required: "Selecione a Conta" }}
                            control={control}
                            render={({ field: { onChange } }) => (
                                <Select onValueChange={onChange}>
                                    <SelectTrigger className="w-full max-w-100">
                                        <SelectValue placeholder="Selecione a Conta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Contas</SelectLabel>
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

                        <FieldLabel>
                            <Field orientation="horizontal">
                                <Controller
                                    name="pago"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    )}
                                />
                                <FieldContent>
                                    <FieldTitle>Despesa Paga</FieldTitle>
                                    <FieldDescription>
                                        Caso já tenha efetuado o pagamento, marque esta opção.
                                    </FieldDescription>
                                </FieldContent>
                            </Field>
                        </FieldLabel>

                        <Field>
                            <FieldLabel>Parcelamento</FieldLabel>
                            <Controller
                                name="parcelas"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value?.toString() ?? "1"}
                                        onValueChange={(v) => field.onChange(Number(v))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="À vista" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">À vista</SelectItem>
                                            {Array.from({ length: 35 }, (_, i) => i + 2).map((n) => (
                                                <SelectItem key={n} value={n.toString()}>
                                                    {n}x
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </Field>

                        <Controller
                            name="data"
                            control={control}
                            rules={{ required: "Selecione a Data" }}
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            data-empty={!field.value}
                                            className="w-full max-w-100 justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
                                        >
                                            {field.value
                                                ? format(new Date(
                                                    field.value.getUTCFullYear(),
                                                    field.value.getUTCMonth(),
                                                    field.value.getUTCDate()
                                                ), "PPP", { locale: ptBR })
                                                : <span>Selecione a Data</span>}
                                            <ChevronDownIcon />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <Calendar
                                            mode="single"
                                            selected={field.value ?? undefined}
                                            onSelect={(d) => {
                                                if (!d) return field.onChange(null)
                                                const local = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0)
                                                field.onChange(local)
                                            }}
                                            className="rounded-lg border"
                                            captionLayout="dropdown"
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />

                        <Button type="submit">Cadastrar</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}