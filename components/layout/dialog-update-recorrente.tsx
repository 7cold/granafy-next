"use client"

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateLancamentoComOpcao } from "@/services/lancamentos"
import { toast } from "sonner"

type DialogUpdateRecorrenteProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: any
    idParcelamento: number | null
    idRecorrencia?: number | null
    onSuccess?: () => void
}

export function DialogUpdateRecorrente({
    open,
    onOpenChange,
    data,
    idParcelamento,
    idRecorrencia,
    onSuccess,
}: DialogUpdateRecorrenteProps) {
    const queryClient = useQueryClient()

    const mutationUpdate = useMutation({
        mutationFn: (opcao: "apenas_este" | "este_e_proximos" | "todos") =>
            updateLancamentoComOpcao(data, opcao, idParcelamento, idRecorrencia),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lancamentos"] })
            toast.success("Lançamento(s) atualizado(s)")
            onOpenChange(false)
            if (onSuccess) onSuccess()
        },
        onError: (err) => {
            toast.error("Erro ao atualizar: " + (err as Error).message)
        },
    })

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Atualizar lançamento {idRecorrencia ? "recorrente" : "parcelado"}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Escolha como deseja aplicar as alterações:
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => mutationUpdate.mutate("apenas_este")}
                        disabled={mutationUpdate.isPending}
                        className="px-4 py-2 text-left rounded border hover:bg-muted transition-colors"
                    >
                        <span className="font-medium">Apenas este</span>
                        <p className="text-xs text-muted-foreground">
                            Atualiza só {idRecorrencia ? "este lançamento" : "esta parcela"}
                        </p>
                    </button>

                    <button
                        onClick={() => mutationUpdate.mutate("este_e_proximos")}
                        disabled={mutationUpdate.isPending}
                        className="px-4 py-2 text-left rounded border hover:bg-muted transition-colors"
                    >
                        <span className="font-medium">Este e próximos</span>
                        <p className="text-xs text-muted-foreground">
                            Atualiza a partir {idRecorrencia ? "deste lançamento" : "desta parcela"}
                        </p>
                    </button>

                    <button
                        onClick={() => mutationUpdate.mutate("todos")}
                        disabled={mutationUpdate.isPending}
                        className="px-4 py-2 text-left rounded border hover:bg-muted transition-colors"
                    >
                        <span className="font-medium">Todas as ocorrências</span>
                        <p className="text-xs text-muted-foreground">
                            Atualiza todo o {idRecorrencia ? "grupo recorrente" : "parcelamento"}
                        </p>
                    </button>
                </div>

                <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancelar</AlertDialogCancel>
            </AlertDialogContent>
        </AlertDialog>
    )
}
