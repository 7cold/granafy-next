import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    console.log('🔍 Middleware rodando em:', request.nextUrl.pathname)
    console.log('🍪 Cookies presentes:', request.cookies.getAll().map(c => c.name))

    const response = NextResponse.next()

    const supabase = createServerClient(
        "https://cridqhqgqfbvxcwsplec.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaWRxaHFncWZidnhjd3NwbGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDIwOTAsImV4cCI6MjA3MTQ3ODA5MH0.q7iEQP9vXArLpKQRzrUI8Ty2eWrba96evABuFBD8h8c",
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)
                ),
            },
        }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    console.log('👤 User:', user?.email ?? 'null')
    console.log('❌ Error:', error?.message ?? 'nenhum')

    // Se não está logado e tenta acessar rota protegida → redireciona para login
    if (!user && !request.nextUrl.pathname.startsWith('/login')) {
        console.log('⛔ Redirecionando para /login')
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Se já está logado e tenta acessar login → redireciona para dashboard
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        console.log('✅ Redirecionando para /dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
}