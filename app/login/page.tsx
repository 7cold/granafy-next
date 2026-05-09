
import { LoginForm } from "@/components/layout/login-form"
import { LiquidBlob } from "@/components/ui/liquid-blob"

export default function LoginPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">

                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <img
                            src="/granafy-logo.svg"
                            alt="Image"
                            className="w-40 block mx-auto mb-20"
                        />
                        <LoginForm />
                    </div>
                </div>
            </div>


            <div className="relative hidden bg-muted lg:block">


                <div className="relative h-full w-full overflow-hidden  bg-white">
                    <LiquidBlob
                        color="#638a0f"
                        secondaryColor="#0f8a32"
                        size={250}
                        speed={4}
                        opacity={0.8}
                    />

                </div>
            </div>
        </div>
    )
}
