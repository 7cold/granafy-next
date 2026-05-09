import { create } from "zustand"
import { persist } from "zustand/middleware"

type Conta = {
    id: number
    nome: string
}



type LancamentosStore = {
    contasSelecionadas: Conta[]
    mesSelecionado: number | null
    anoSelecionado: number | null
    setContasSelecionadas: (contas: Conta[]) => void
    setMes: (mes: number | null) => void
    setAno: (ano: number | null) => void
}

export const useLancamentosStore = create<LancamentosStore>()(
    persist(
        (set) => ({
            contasSelecionadas: [],
            mesSelecionado: new Date().getMonth() + 1,
            anoSelecionado: new Date().getFullYear(),
            setContasSelecionadas: (contas) => set({ contasSelecionadas: contas }),
            setMes: (mes) => set({ mesSelecionado: mes }),
            setAno: (ano) => set({ anoSelecionado: ano }),
        }),
        {
            name: "lancamentos-store", // chave no localStorage
        }
    )
)