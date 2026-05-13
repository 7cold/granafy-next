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
import { useCartoes } from "@/services/cartoes"

type DialogLancamentoProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    modo?: "conta" | "cartao"
    defaultCartaoId?: number
}

export function DialogLancamento({ open, onOpenChange, modo = "conta", defaultCartaoId }: DialogLancamentoProps) {
    const queryClient = useQueryClient()
    const { data: categorias } = useCategorias()
    const { data: contas } = useContas()
    const { data: cartoes } = useCartoes()

    const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
        defaultValues: {
            tipo: "despesa",
            descricao: "",
            valor: null,
            categoria_id: "",
            conta_id: "",
            conta_destino_id: "",
            id_cartao: defaultCartaoId ? defaultCartaoId.toString() : "",
            pago: modo == "cartao" ? false : true,
            data: new Date(),
            parcelas: 1,
            recorrente: false,
        }
    })

    const tipoSelecionado = watch("tipo")
    const isRecorrente = watch("recorrente")

    async function onSubmit(data: any, continuar: boolean = false) {
        try {
            if (data.tipo === "transferencia") {
                if (!data.conta_id || !data.conta_destino_id) {
                    toast.error("Selecione as contas de origem e destino");
                    return;
                }
                if (data.conta_id === data.conta_destino_id) {
                    toast.error("As contas de origem e destino devem ser diferentes");
                    return;
                }

                const contaOrigem = contas?.find(c => c.id.toString() === data.conta_id.toString());
                const contaDestino = contas?.find(c => c.id.toString() === data.conta_destino_id.toString());
                const transferId = Math.floor(Date.now() * 1000 + Math.random() * 1000);

                // Cria o lançamento de SAÍDA na conta de ORIGEM
                await createLancamento({
                    ...data,
                    tipo: "despesa",
                    descricao: `⇅ Transferência - Para ${contaDestino?.nome ?? "Conta Destino"}`,
                    valor: -Math.abs(data.valor),
                    conta_id: data.conta_id,
                    pago: true,
                    categoria_id: "0",
                    id_recorrencia: transferId,
                });

                // Cria o lançamento de ENTRADA na conta de DESTINO
                await createLancamento({
                    ...data,
                    tipo: "receita",
                    descricao: `⇅ Transferência - De ${contaOrigem?.nome ?? "Conta Origem"}`,
                    valor: Math.abs(data.valor),
                    conta_id: data.conta_destino_id,
                    pago: true,
                    categoria_id: "0",
                    id_recorrencia: transferId,
                });
            } else {
                if (!data.descricao || data.descricao.trim() === "") {
                    const categoriaSelecionada = categorias?.find(c => c.id.toString() === data.categoria_id?.toString())
                    if (categoriaSelecionada && categoriaSelecionada.nome) {
                        data.descricao = categoriaSelecionada.nome
                    }
                }

                if (data.descricao && typeof data.descricao === "string") {
                    data.descricao = data.descricao.charAt(0).toUpperCase() + data.descricao.slice(1)
                }

                await createLancamento(data);
            }

            toast.success("Lançamento cadastrado com sucesso!")
            queryClient.invalidateQueries({ queryKey: ["lancamentos"] })

            if (continuar) {
                reset({
                    tipo: data.tipo,
                    descricao: "",
                    valor: null,
                    categoria_id: "",
                    conta_id: data.conta_id,
                    conta_destino_id: data.conta_destino_id,
                    id_cartao: modo === "cartao" ? data.id_cartao : "",
                    pago: modo === "cartao" ? false : true,
                    data: data.data,
                    parcelas: 1,
                    recorrente: false,
                })
            } else {
                reset()
                onOpenChange(false)
            }
        } catch (err: any) {
            toast.error("Erro ao cadastrar lançamento: " + err.message)
        }
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

                <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
                    <div className="grid grid-cols-10 gap-4">


                        <div className="col-span-10">
                            <Controller
                                name="tipo"
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <Tabs value={value} onValueChange={onChange}>
                                        <TabsList className="w-full grid grid-cols-3">
                                            <TabsTrigger value="despesa">Despesa</TabsTrigger>
                                            <TabsTrigger value="receita">Receita</TabsTrigger>
                                            <TabsTrigger value="transferencia">Transferência</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                )}
                            />
                        </div>



                        {/* Linha 1 */}
                        {tipoSelecionado !== "transferencia" && (
                            <Field className="col-span-7">
                                <FieldLabel>Descrição</FieldLabel>
                                <Input
                                    type="text"
                                    placeholder="Descrição do lançamento"
                                    {...register("descricao", {
                                        onChange: (e) => {
                                            const val = e.target.value;
                                            if (val) {
                                                e.target.value = val.charAt(0).toUpperCase() + val.slice(1);
                                            }
                                        }
                                    })}
                                />
                            </Field>
                        )}

                        <Field className={tipoSelecionado === "transferencia" ? "col-span-10" : "col-span-3"}>
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

                        {/* Linha 2 */}

                        {/* Linha 3 */}
                        {tipoSelecionado !== "transferencia" && (
                            <div className="col-span-5">
                                <FieldLabel>Categoria</FieldLabel>
                                <Controller
                                    name="categoria_id"
                                    control={control}
                                    rules={{ required: "Selecione a categoria" }}
                                    render={({ field: { onChange, value } }) => (
                                        <Select value={value} onValueChange={onChange}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecione a Categoria" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Categorias</SelectLabel>
                                                    {categorias?.filter((e) => e.ativo && e.tipo === (tipoSelecionado ?? "despesa"))
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
                            </div>
                        )}

                        {modo === "conta" ? (
                            <div className="col-span-5">
                                <FieldLabel>{tipoSelecionado === "transferencia" ? "Conta de Origem" : "Conta"}</FieldLabel>
                                <Controller
                                    name="conta_id"
                                    rules={{ required: "Selecione a Conta" }}
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Select value={value} onValueChange={onChange}>
                                            <SelectTrigger className="w-full">
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
                            </div>
                        ) : (
                            tipoSelecionado !== "transferencia" && (
                                <div className="col-span-5">
                                    <FieldLabel>Cartão</FieldLabel>
                                    <Controller
                                        name="id_cartao"
                                        rules={{ required: "Selecione o Cartão" }}
                                        control={control}
                                        render={({ field: { onChange, value } }) => (
                                            <Select value={value} onValueChange={onChange}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione o Cartão" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>Cartões</SelectLabel>
                                                        {cartoes?.filter((e: any) => e.ativo).map((cartao: any) => (
                                                            <SelectItem key={cartao.id} value={cartao.id.toString()}>
                                                                Cartão final {cartao.nome}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            )
                        )}

                        {tipoSelecionado === "transferencia" && (
                            <div className="col-span-5">
                                <FieldLabel>Conta de Destino</FieldLabel>
                                <Controller
                                    name="conta_destino_id"
                                    rules={{ required: "Selecione a Conta de Destino" }}
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Select value={value} onValueChange={onChange}>
                                            <SelectTrigger className="w-full">
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
                            </div>
                        )}

                        {tipoSelecionado !== "transferencia" && (
                            <Field className="col-span-5">
                                <FieldLabel>Parcelamento</FieldLabel>
                                <Controller
                                    name="parcelas"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            disabled={isRecorrente}
                                            value={isRecorrente ? "1" : (field.value?.toString() ?? "1")}
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
                        )}

                        <Field className={tipoSelecionado === "transferencia" ? "col-span-5 flex flex-col justify-center" : "col-span-5 flex flex-col justify-center"}>
                            <FieldLabel>Data</FieldLabel>
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
                                                className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
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
                                                    field.onChange(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0))
                                                    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
                                                }}
                                                className="rounded-lg border"
                                                captionLayout="dropdown"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            />
                        </Field>

                        {/* Linha 4 */}
                        {tipoSelecionado !== "transferencia" && (
                            <>
                                <div className="col-span-5 flex items-center">
                                    <FieldLabel className="w-full m-0">
                                        <Field orientation="horizontal" className="w-full">
                                            <Controller
                                                name="pago"
                                                control={control}
                                                render={({ field }) => (
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                )}
                                            />
                                            <FieldContent>
                                                <FieldTitle>Despesa Paga</FieldTitle>
                                                <FieldDescription className="text-xs">
                                                    Caso já pago, marque esta opção.
                                                </FieldDescription>
                                            </FieldContent>
                                        </Field>
                                    </FieldLabel>
                                </div>

                                <div className="col-span-5 flex items-center">
                                    <FieldLabel className="w-full m-0">
                                        <Field orientation="horizontal" className="w-full">
                                            <Controller
                                                name="recorrente"
                                                control={control}
                                                render={({ field }) => (
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                )}
                                            />
                                            <FieldContent>
                                                <FieldTitle>Lanc. Recorrente</FieldTitle>
                                                <FieldDescription className="text-xs">
                                                    Repete mensalmente por 5 anos.
                                                </FieldDescription>
                                            </FieldContent>
                                        </Field>
                                    </FieldLabel>
                                </div>
                            </>
                        )}

                        {/* Linha 5 */}


                        <div className="col-span-10 flex gap-2 mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={handleSubmit((data) => onSubmit(data, true))}
                            >
                                Cadastrar e Continuar
                            </Button>
                            <Button type="submit" className="flex-1">
                                Cadastrar
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}