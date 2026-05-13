"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteLancamentoComOpcao } from "@/services/lancamentos"
import { toast } from "sonner"

type DialogDeleteLancamentoProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    lancamentoId: number
    temParcelamento: boolean
    idParcelamento: number | null
    idRecorrencia?: number | null
    descricao?: string
}

export function DialogDeleteLancamento({
    open,
    onOpenChange,
    lancamentoId,
    temParcelamento,
    idParcelamento,
    idRecorrencia,
    descricao,
}: DialogDeleteLancamentoProps) {
    const queryClient = useQueryClient()

    const mutationDelete = useMutation({
        mutationFn: (opcao: "apenas_este" | "este_e_proximos" | "todos") =>
            deleteLancamentoComOpcao(lancamentoId, opcao, idParcelamento, idRecorrencia),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lancamentos"] })
            toast.success("Lançamento(s) excluído(s)")
            onOpenChange(false)
        },
        onError: (err) => {
            toast.error("Erro ao excluir: " + (err as Error).message)
        },
    })

    const isTransferencia = descricao?.includes("⇅")

    if ((!temParcelamento && !idRecorrencia) || isTransferencia) {
        // sem parcelamento ou transferência — apaga direto (o serviço cuida do par da transferência)
        return (
            <AlertDialog open={open} onOpenChange={onOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir {isTransferencia ? "transferência" : "lançamento"}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isTransferencia 
                                ? "Isso excluirá os dois lançamentos vinculados desta transferência." 
                                : "Esta ação não pode ser desfeita."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => mutationDelete.mutate("apenas_este")}
                        disabled={mutationDelete.isPending}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {mutationDelete.isPending ? "Excluindo..." : "Excluir"}
                    </AlertDialogAction>
                </AlertDialogContent>
            </AlertDialog>
        )
    }

    // com parcelamento — 3 opções
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir lançamento {idRecorrencia ? "recorrente" : "parcelado"}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Escolha como deseja proceder:
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => mutationDelete.mutate("apenas_este")}
                        disabled={mutationDelete.isPending}
                        className="px-4 py-2 text-left rounded border hover:bg-muted transition-colors"
                    >
                        <span className="font-medium">Apenas este</span>
                        <p className="text-xs text-muted-foreground">
                            Exclui só {idRecorrencia ? "este lançamento" : "esta parcela"}
                        </p>
                    </button>

                    <button
                        onClick={() => mutationDelete.mutate("este_e_proximos")}
                        disabled={mutationDelete.isPending}
                        className="px-4 py-2 text-left rounded border hover:bg-muted transition-colors"
                    >
                        <span className="font-medium">Este e próximos</span>
                        <p className="text-xs text-muted-foreground">
                            Exclui a partir {idRecorrencia ? "deste lançamento" : "desta parcela"}
                        </p>
                    </button>

                    <button
                        onClick={() => mutationDelete.mutate("todos")}
                        disabled={mutationDelete.isPending}
                        className="px-4 py-2 text-left rounded border hover:bg-destructive/20 transition-colors"
                    >
                        <span className="font-medium text-destructive">Todas as ocorrências</span>
                        <p className="text-xs text-muted-foreground">
                            Exclui todo o {idRecorrencia ? "grupo recorrente" : "parcelamento"}
                        </p>
                    </button>
                </div>

                <AlertDialogCancel>Cancelar</AlertDialogCancel>
            </AlertDialogContent>
        </AlertDialog>
    )
}