"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { Button } from "../ui/button"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { DialogDeleteLancamento } from "./dialog-delete-lancamento"
import { toast } from "sonner"
import { DialogEditarLancamento } from "./dialog-editar"
import { useSaldosPorDia, SaldoDia } from '@/hooks/useSaldoDia'
import { Check, Pencil, X, Save, CheckCircle2, Circle, CalendarIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NumericFormat } from "react-number-format"
import { updateLancamento } from "@/services/lancamentos"

interface Props<TData extends { data?: string }> {
    columns: ColumnDef<TData>[]
    data: TData[]
    onFaturaClick?: (cartao: any) => void
    idsContas?: number[]
}

export function DataTable<TData extends { data?: string }>({ columns, data, onFaturaClick, idsContas }: Props<TData>) {
    const [openSheet, setOpenSheet] = React.useState(false)
    const [openEditDialog, setOpenEditDialog] = React.useState(false)

    const [rowSelected, setRowSelected] = React.useState<TData | null>(null)
    const queryClient = useQueryClient()
    const memoData = React.useMemo(() => data, [data])
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false)
    const datas = data
        .map(row => (row as any).data?.slice(0, 10))
        .filter(Boolean)
        .sort()

    const fmt = (v: number) =>
        v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    const dataInicio = datas[0]
    const dataFim = datas[datas.length - 1]

    const { data: saldosPorDia = {} } = useSaldosPorDia(dataInicio, dataFim, idsContas)

    // Estados para edição rápida
    const [editField, setEditField] = React.useState<string | null>(null)
    const [editValue, setEditValue] = React.useState<any>(null)

    // Resetar estados de edição ao fechar o sheet ou trocar de linha
    React.useEffect(() => {
        if (!openSheet) {
            setEditField(null)
            setEditValue(null)
        }
    }, [openSheet, rowSelected])

    const mutationUpdate = useMutation({
        mutationFn: async (newData: any) => {
            const original = rowSelected as any
            const payload = {
                id: original.id,
                tipo: original.tipo,
                descricao: original.descricao,
                valor: original.valor,
                categoria_id: original.categoria_id,
                conta_id: original.conta_id,
                id_cartao: original.id_cartao,
                pago: original.pago,
                data: original.data,
                ...newData
            }
            return updateLancamento(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lancamentos"] })
            toast.success("Lançamento atualizado")
            setEditField(null)
        },
        onError: (err) => {
            toast.error("Erro ao atualizar: " + (err as Error).message)
        }
    })

    const handleQuickUpdate = (field: string, value: any) => {
        mutationUpdate.mutate({ [field]: value })
        // Atualiza o estado local do rowSelected para refletir a mudança no Sheet imediatamente
        if (rowSelected) {
            setRowSelected({ ...rowSelected, [field]: value })
        }
    }



    const table = useReactTable({
        data: memoData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    function handleRowClick(row: TData) {
        if ((row as any).isFatura) {
            onFaturaClick?.((row as any).cartao)
        } else {
            setRowSelected(row)
            setOpenSheet(true)
        }
    }



    function handleOpenEdit() {
        setOpenSheet(false)
        setOpenEditDialog(true)
    }

    return (
        <>
            <div className="overflow-hidden rounded-md border m-6">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <TableHead key={header.id} style={{ width: header.column.getSize() }}>
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.map((row, index) => {
                            const rows = table.getRowModel().rows
                            const diaAtual = row.original.data?.slice(0, 10)
                            const diaAnterior = rows[index - 1]?.original.data?.slice(0, 10)
                            const diaProximo = rows[index + 1]?.original.data?.slice(0, 10)
                            const primeiroDoDia = index === 0 || diaAtual !== diaAnterior
                            const ultimoDoDia = diaAtual !== diaProximo
                            const saldo = diaAtual ? saldosPorDia[diaAtual] : null

                            return (
                                <React.Fragment key={row.id}>


                                    {/* Linha normal */}
                                    <TableRow
                                        className={`cursor-pointer transition-colors ${!(row.original as any).pago
                                            ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
                                            : "hover:bg-muted/50"
                                            }`}
                                        onClick={() => handleRowClick(row.original)}
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>

                                    {/* Saldo final — rodapé do grupo */}
                                    {ultimoDoDia && (
                                        <TableRow className="pointer-events-none bg-muted/30 hover:bg-muted/30">
                                            <TableCell
                                                colSpan={table.getAllColumns().length}
                                                className="py-1.5 px-4 text-xs italic text-muted-foreground border-b-2 border-border"
                                            >
                                                Saldo final
                                                <span className={`float-right font-medium ${saldo && saldo.saldo_final >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {saldo ? fmt(saldo.saldo_final) : '—'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )}

                                </React.Fragment>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Sheet de Detalhes Rápidos */}
            <Sheet open={openSheet} onOpenChange={setOpenSheet}>
                <SheetContent side="right" className="w-105">
                    <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b mt-8">
                        <SheetTitle>Detalhes</SheetTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setOpenDeleteDialog(true)}
                            >
                                Apagar
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenEdit}
                            >
                                Editar
                            </Button>
                        </div>
                    </SheetHeader>

                    <div className="m-4 text-sm space-y-4 rounded-lg border p-4 shadow-sm bg-card">
                        {/* Descrição */}
                        <div className="flex flex-col gap-1.5 border-b pb-3">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição</span>
                            {editField === "descricao" ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="h-8"
                                        autoFocus
                                    />
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleQuickUpdate("descricao", editValue)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => setEditField(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                                    onClick={() => {
                                        setEditField("descricao")
                                        setEditValue((rowSelected as any)?.descricao)
                                    }}
                                >
                                    <span className="text-base font-medium">{(rowSelected as any)?.descricao}</span>
                                    <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )}
                        </div>

                        {/* Valor e Status Pago */}
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex flex-col gap-1.5 flex-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</span>
                                {editField === "valor" ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(editValue || 0)}
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(/\D/g, "");
                                                const cents = parseInt(rawValue || "0", 10);
                                                setEditValue(cents / 100);
                                            }}
                                            className="h-8 w-40 font-mono text-left"
                                            autoFocus
                                        />
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleQuickUpdate("valor", Number(editValue))}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => setEditField(null)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div
                                        className="flex items-center gap-2 group cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors w-fit"
                                        onClick={() => {
                                            setEditField("valor")
                                            setEditValue(Math.abs((rowSelected as any)?.valor || 0))
                                        }}
                                    >
                                        <span className={`text-xl font-bold ${(rowSelected as any)?.valor < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((rowSelected as any)?.valor || 0)}
                                        </span>
                                        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-9 gap-2 px-3 rounded-full transition-all ${(rowSelected as any)?.pago
                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                            : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                        }`}
                                    onClick={() => handleQuickUpdate("pago", !(rowSelected as any)?.pago)}
                                >
                                    {(rowSelected as any)?.pago ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                    <span className="font-semibold">{(rowSelected as any)?.pago ? "Pago" : "Pendente"}</span>
                                </Button>
                            </div>
                        </div>

                        {/* Data */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data do Lançamento</span>
                            {editField === "data" ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="date"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="h-8 w-40"
                                        autoFocus
                                    />
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleQuickUpdate("data", editValue)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => setEditField(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                                    onClick={() => {
                                        setEditField("data")
                                        setEditValue((rowSelected as any)?.data?.slice(0, 10))
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-base">
                                            {(rowSelected as any)?.data &&
                                                new Date((rowSelected as any).data + 'T00:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )}
                        </div>
                    </div>
                </SheetContent>


                <DialogDeleteLancamento
                    open={openDeleteDialog}
                    onOpenChange={setOpenDeleteDialog}
                    lancamentoId={(rowSelected as any)?.id}
                    temParcelamento={!!(rowSelected as any)?.id_parcelamento}
                    idParcelamento={(rowSelected as any)?.id_parcelamento}
                    idRecorrencia={(rowSelected as any)?.id_recorrencia}
                    descricao={(rowSelected as any)?.descricao}
                />
            </Sheet>

            {/* Dialog de Formulário de Edição */}
            <DialogEditarLancamento
                open={openEditDialog}
                onOpenChange={setOpenEditDialog}
                lancamento={rowSelected}
            />
        </>
    )
}