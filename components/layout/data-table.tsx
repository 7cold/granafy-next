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

interface Props<TData extends { data?: string }> {
    columns: ColumnDef<TData>[]
    data: TData[]
}

export function DataTable<TData extends { data?: string }>({ columns, data }: Props<TData>) {
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

    const { data: saldosPorDia = {} } = useSaldosPorDia(dataInicio, dataFim)



    const table = useReactTable({
        data: memoData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    function handleRowClick(row: TData) {
        setRowSelected(row)
        setOpenSheet(true)
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
                                    <TableHead key={header.id}>
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
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => handleRowClick(row.original)}
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id}>
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

                    <div className="m-4 text-sm space-y-4 rounded-lg border p-3 shadow-sm" >
                        <div className="grid grid-cols-2 border-b pb-2">
                            <span className="font-semibold">Descrição:</span>
                            <span>{(rowSelected as any)?.descricao}</span>
                        </div>
                        <div className="grid grid-cols-2 border-b pb-2">
                            <span className="font-semibold">Valor:</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((rowSelected as any)?.valor || 0)}</span>
                        </div>
                        <div className="grid grid-cols-2 border-b pb-2">
                            <span className="font-semibold">Status:</span>
                            <span>{(rowSelected as any)?.pago ? "Pago" : "Pendente"}</span>
                        </div>
                        <div className="grid grid-cols-2 border-b pb-2">
                            <span className="font-semibold">Data:</span>
                            <span>
                                {(rowSelected as any)?.data &&
                                    new Date((rowSelected as any).data).toLocaleDateString('pt-BR', {
                                        timeZone: 'UTC',
                                    })}
                            </span>
                        </div>
                    </div>
                </SheetContent>


                <DialogDeleteLancamento
                    open={openDeleteDialog}
                    onOpenChange={setOpenDeleteDialog}
                    lancamentoId={(rowSelected as any)?.id}
                    temParcelamento={!!(rowSelected as any)?.id_parcelamento}
                    idParcelamento={(rowSelected as any)?.id_parcelamento}
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