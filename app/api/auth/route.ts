import { NextResponse } from "next/server";
import { supabaseAdmin, createAuthClient } from "@/lib/supabaseAdmin";
import { getAccessTokenFromRequest } from "@/lib/auth";
import { errorText } from "@/lib/errors";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/authCookies";

enum AuthMode {
  LOGIN = "login",
  REGISTER = "register",
}

export async function POST(req: Request) {
  try {
    const { email, password, mode } = await req.json();
    const isRegister = mode === AuthMode.REGISTER;

    if (isRegister) {
      // Use admin.createUser on the server to create the user without creating a session
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) {
        return NextResponse.json(
          { error: error.message ?? "Falha ao cadastrar usuário." },
          { status: 401 },
        );
      }
      if (!data.user) {
        return NextResponse.json(
          { error: "Falha ao cadastrar usuário." },
          { status: 500 },
        );
      }

      return NextResponse.json({
        user: { id: data.user.id, email: data.user.email },
        message: "Conta criada com sucesso.",
        needsConfirmation: false,
      });
    }

    // login flow
    // Cliente descartável: o login não pode ficar guardado no supabaseAdmin
    const { data, error } = await createAuthClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Falha ao autenticar." },
        { status: 401 },
      );
    }
    if (!data.session || !data.user) {
      return NextResponse.json(
        { error: "Falha ao autenticar." },
        { status: 401 },
      );
    }

    const nextResponse = NextResponse.json({
      user: { id: data.user.id, email: data.user.email },
    });
    nextResponse.cookies.set(
      ACCESS_COOKIE,
      data.session.access_token,
      accessCookieOptions(data.session.expires_in),
    );
    if (data.session.refresh_token) {
      nextResponse.cookies.set(
        REFRESH_COOKIE,
        data.session.refresh_token,
        refreshCookieOptions,
      );
    }

    return nextResponse;
  } catch (e) {
    return NextResponse.json(
      { error: errorText(e, "Login error") },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  // Revoga a sessão no Supabase também — sem isso o refresh token continuaria
  // válido mesmo depois do logout.
  const token = getAccessTokenFromRequest(req);
  if (token) {
    // "local": só este dispositivo (o padrão "global" deslogaria todos)
    await supabaseAdmin.auth.admin.signOut(token, "local").catch(() => {});
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
