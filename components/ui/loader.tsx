import { Loader2 } from "lucide-react"

export function Loader() {
    return (
        <div className="flex h-[450px] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                <p className="text-sm text-muted-foreground animate-pulse">Carregando dashboard...</p>
            </div>
        </div>
    )
}
