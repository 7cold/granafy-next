import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        "https://cridqhqgqfbvxcwsplec.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaWRxaHFncWZidnhjd3NwbGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDIwOTAsImV4cCI6MjA3MTQ3ODA5MH0.q7iEQP9vXArLpKQRzrUI8Ty2eWrba96evABuFBD8h8c",
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const isLoginPage = request.nextUrl.pathname.startsWith('/login')

    // Redireciona para login se não estiver logado
    if (!user && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redireciona para dashboard se já estiver logado e tentar acessar login
    if (user && isLoginPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (svg, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}