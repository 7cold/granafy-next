"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
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

import {
    LayoutDashboard,
    ArrowLeftRight,
    Tags,
    Wallet,
    CreditCard,
    BarChart3,
    Home,
    Settings2
} from "lucide-react"

const data = {
    navMain: [
        {
            title: "Início",
            url: "#",
            icon: Home,
            items: [
                { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
            ],
        },
        {
            title: "Operações",
            url: "#",
            icon: Settings2,
            items: [
                { title: "Lançamentos", url: "/lancamentos", icon: ArrowLeftRight },
                { title: "Categorias", url: "/categorias", icon: Tags },
                { title: "Contas", url: "/contas", icon: Wallet },
                { title: "Cartões", url: "/cartoes", icon: CreditCard },
                { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const router = useRouter()
    const pathname = usePathname()
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
                            <SidebarMenu className="flex gap-2">
                                {item.items.map((subItem) => {
                                    const isActive = pathname === subItem.url
                                    return (
                                        <SidebarMenuItem key={subItem.title}>
                                            <SidebarMenuButton

                                                asChild
                                                isActive={isActive}
                                                className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm !bg-green-100 dark:!bg-zinc-800" : ""}
                                            >
                                                <Link href={subItem.url} className="flex items-center gap-3">
                                                    {subItem.icon && <subItem.icon className="h-4 w-4" />}
                                                    <span>{subItem.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
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