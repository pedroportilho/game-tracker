import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserByAccessToken, getAccessTokenFromRequest } from '@/lib/auth'

enum AuthMode {
  LOGIN = 'login',
  REGISTER = 'register',
}

export async function GET(req: Request) {
  const token = getAccessTokenFromRequest(req)
  const user = await getUserByAccessToken(token)
  return NextResponse.json({ user: user ? { id: user.id, email: user.email } : null })
}

export async function POST(req: Request) {
  try {
    const { email, password, mode } = await req.json()
    const isRegister = mode === AuthMode.REGISTER

    if (isRegister) {
      // Use admin.createUser on the server to create the user without creating a session
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error) {
        return NextResponse.json({ error: error.message ?? 'Falha ao cadastrar usuário.' }, { status: 401 })
      }
      if (!data.user) {
        return NextResponse.json({ error: 'Falha ao cadastrar usuário.' }, { status: 500 })
      }

      return NextResponse.json({ user: { id: data.user.id, email: data.user.email }, message: 'Conta criada com sucesso.', needsConfirmation: false })
    }

    // login flow
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
    if (error) {
      return NextResponse.json({ error: error.message ?? 'Falha ao autenticar.' }, { status: 401 })
    }
    if (!data.session || !data.user) {
      return NextResponse.json({ error: 'Falha ao autenticar.' }, { status: 401 })
    }

    const result: any = { user: { id: data.user.id, email: data.user.email } }
    const nextResponse = NextResponse.json(result)
    nextResponse.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in,
    })
    if (data.session.refresh_token) {
      nextResponse.cookies.set('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return nextResponse
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Login error' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = new NextResponse(null, { status: 204 })
  response.cookies.set('sb-access-token', '', { path: '/', maxAge: 0 })
  response.cookies.set('sb-refresh-token', '', { path: '/', maxAge: 0 })
  return response
}
