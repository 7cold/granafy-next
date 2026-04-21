import { useState } from 'react'

export type Filtro = 'todos' | 'pagos' | 'nao_pagos'

export function useFiltroLancamentos() {
    const [filtro, setFiltro] = useState<Filtro>('todos')
    return { filtro, setFiltro }
}