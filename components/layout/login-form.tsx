"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type FormData = {
    email: string
    password: string
}

export function LoginForm() {
    const router = useRouter()
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>()

    async function onSubmit(data: FormData) {
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        })
        if (error) {
            toast.error("Email ou senha incorretos")
            return
        }
        // Só push — o middleware já cuida do redirecionamento se necessário
        router.push("/dashboard")
        router.refresh() // ← depois do push
    }


    return (
        <form className={cn("flex flex-col gap-6")} onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Login em sua conta</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        Entre com seu e-mail para acesso a sua conta
                    </p>
                </div>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        placeholder="exemplo@exemplo.com"
                        {...register("email", { required: true })}
                    />
                </Field>
                <Field>
                    <div className="flex items-center">
                        <FieldLabel htmlFor="password">Senha</FieldLabel>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        {...register("password", { required: true })}
                    />
                </Field>
                <Field>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Entrando..." : "Login"}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
}
