"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { LogOut, ChevronsUpDown } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const data = {
    navMain: [
        {
            title: "Início",
            url: "#",
            items: [
                { title: "Dashboard", url: "/dashboard", isActive: true },
            ],
        },
        {
            title: "Opções",
            url: "#",
            items: [
                { title: "Lançamentos", url: "/lancamentos", isActive: false },
                { title: "Relatórios", url: "/relatorios", isActive: false },
                { title: "Categorias", url: "/categorias", isActive: false },
                { title: "Contas", url: "/contas", isActive: false },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const router = useRouter()
    const [email, setEmail] = React.useState<string | null>(null)

    React.useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setEmail(data.user?.email ?? null)
        })
    }, [])

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push("/login")
    }

    const initials = email ? email.slice(0, 2).toUpperCase() : "?"

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <img
                    src="/granafy-logo.svg"
                    alt="Image"
                    className="w-20 block mx-auto mt-2"
                />
            </SidebarHeader>

            <SidebarContent>
                {data.navMain.map((item) => (
                    <SidebarGroup key={item.title}>
                        <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {item.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={item.isActive}>
                                            <a href={item.url}>{item.title}</a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="h-12 gap-3">
                                    <Avatar className="h-7 w-7">
                                        <AvatarFallback className="text-xs">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate text-sm">{email ?? "..."}</span>
                                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="start" className="w-56">
                                <DropdownMenuItem
                                    className="text-red-500 cursor-pointer"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}