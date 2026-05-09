// components/header-notificacoes.tsx
"use client"

import { useParcelasProximasDoFim } from "@/hooks/useParcelasProximasDoFim"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function HeaderNotificacoes() {
    const { data: parcelasProximas = [] } = useParcelasProximasDoFim()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {parcelasProximas.length > 0 && (
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                {parcelasProximas.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                        Nenhuma parcela próxima do fim
                    </div>
                ) : (
                    <>
                        <div className="font-semibold px-4 py-2 text-sm">
                            Parcelas próximas do fim
                        </div>
                        <DropdownMenuSeparator />
                        {parcelasProximas.map((p: any) => (
                            <DropdownMenuItem key={p.id_parcelamento} className="flex flex-col items-start">
                                <span className="font-medium">{p.descricao}</span>
                                <span className="text-xs text-muted-foreground">
                                    Últimas {p.count} parcela{p.count > 1 ? "s" : ""}
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}