import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent, ComboboxEmpty, ComboboxItem, ComboboxList, ComboboxValue, useComboboxAnchor } from "../ui/combobox";
import { FieldLabel } from "../ui/field";
import { useContas } from "@/services/contas";
import { useLancamentosStore } from "../../store/lancamentosStore"

export function ComponenteContas() {

    const contasSelecionadas = useLancamentosStore(s => s.contasSelecionadas)
    const setContas = useLancamentosStore(s => s.setContasSelecionadas)
    const { data: contas, isFetching } = useContas()
    const contasItems = (contas ?? []).filter((c: any) => c.ativo === true);
    const anchor = useComboboxAnchor()

    // Garante que a referência dos objetos selecionados seja a mesma dos itens da lista
    const value = contasSelecionadas.map((cs: any) => 
        contasItems.find((ci: any) => ci.id === cs.id) || cs
    )

    return (
        <Combobox
            multiple
            items={contasItems}
            value={value}
            onValueChange={setContas}
        >
            <FieldLabel>Contas</FieldLabel>
            <ComboboxChips ref={anchor} className="w-64">
                <ComboboxValue>
                    {(values) => (
                        <>
                            {values.map((v: any) => (
                                <ComboboxChip key={v.id}>
                                    {v.nome}
                                </ComboboxChip>
                            ))}
                            <ComboboxChipsInput />
                        </>
                    )}
                </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={anchor}>
                {contasItems.length == 0 ? <ComboboxEmpty>Nenhum Item</ComboboxEmpty> : isFetching == true ? <ComboboxEmpty>Carregando</ComboboxEmpty> :
                    <ComboboxList>
                        {(item: any) => (
                            <ComboboxItem key={item.id} value={item}>
                                {item.nome}
                            </ComboboxItem>
                        )}
                    </ComboboxList>}

            </ComboboxContent>
        </Combobox>)
}