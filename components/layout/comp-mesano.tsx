import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { useLancamentosStore } from "@/store/lancamentosStore"
import { FieldLabel } from "../ui/field"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function ComponenteMesAno() {

    const mesSelecionado = useLancamentosStore(s => s.mesSelecionado)
    const anoSelecionado = useLancamentosStore(s => s.anoSelecionado)
    const setMes = useLancamentosStore(s => s.setMes)
    const setAno = useLancamentosStore(s => s.setAno)

    const anos = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 3 + i)

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]

    function mesAnterior() {
        if (!mesSelecionado || !anoSelecionado) return

        if (mesSelecionado === 1) {
            setMes(12)
            setAno(anoSelecionado - 1)
        } else {
            setMes(mesSelecionado - 1)
        }
    }

    function proximoMes() {
        if (!mesSelecionado || !anoSelecionado) return

        if (mesSelecionado === 12) {
            setMes(1)
            setAno(anoSelecionado + 1)
        } else {
            setMes(mesSelecionado + 1)
        }
    }

    return (
        <>

            <div className="flex items-center gap-2">

                {/* BOTÃO ESQUERDA */}
                <button
                    onClick={mesAnterior}
                    className="p-2 rounded-md border hover:bg-gray-100"
                >
                    <ChevronLeft size={18} />
                </button>

                {/* MÊS */}
                <Select
                    value={mesSelecionado?.toString()}
                    onValueChange={(v) => setMes(Number(v))}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Mês" />
                    </SelectTrigger>

                    <SelectContent>
                        {meses.map((m, i) => (
                            <SelectItem key={i} value={String(i + 1)}>
                                {m}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* ANO */}
                <Select
                    value={anoSelecionado?.toString()}
                    onValueChange={(v) => setAno(Number(v))}
                >
                    <SelectTrigger className="w-28">
                        <SelectValue placeholder="Ano" />
                    </SelectTrigger>

                    <SelectContent>
                        {anos.map((a) => (
                            <SelectItem key={a} value={String(a)}>
                                {a}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* BOTÃO DIREITA */}
                <button
                    onClick={proximoMes}
                    className="p-2 rounded-md border hover:bg-gray-100"
                >
                    <ChevronRight size={18} />
                </button>

            </div>
        </>
    )
}