"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"

type FormData = {
    email: string
    password: string
    confirmPassword: string
}

export function DialogCadastro() {
    const [open, setOpen] = useState(false)
    const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>()

    const password = watch("password")

    async function onSubmit(data: FormData) {
        if (data.password !== data.confirmPassword) {
            toast.error("As senhas não coincidem")
            return
        }

        const { data: signUpData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        })

        if (error) {
            toast.error(error.message)
            return
        }

        if (signUpData.user) {
            toast.success("Conta criada com sucesso! Faça login para continuar.")
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="link" className="px-0 font-semibold text-emerald-600">
                    Cadastre-se agora
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Criar nova conta</DialogTitle>
                    <DialogDescription>
                        Preencha os campos abaixo para começar a organizar suas finanças.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <Field>
                        <FieldLabel htmlFor="reg-email">E-mail</FieldLabel>
                        <Input
                            id="reg-email"
                            type="email"
                            autoComplete="off"
                            placeholder="exemplo@exemplo.com"
                            {...register("email", { required: true })}
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="reg-password">Senha</FieldLabel>
                        <Input
                            id="reg-password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Sua senha secreta"
                            {...register("password", { required: true, minLength: 6 })}
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="confirm-password">Confirmar Senha</FieldLabel>
                        <Input
                            id="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Repita a senha"
                            {...register("confirmPassword", { required: true })}
                        />
                    </Field>
                    <div className="pt-2">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Criando conta..." : "Criar Conta"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
