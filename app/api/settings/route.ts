import { NextResponse, type NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { REFRESH_COOKIE, refreshSession, setSessionCookies } from "@/lib/authCookies";
import { errorText } from "@/lib/errors";
import { parseSettings } from "@/lib/settings";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// PUT /api/settings — salva as configurações na conta (user_metadata).
//
// As configurações viajam dentro do token de login. Depois de gravar, a sessão
// DESTE aparelho é renovada para o token novo já trazer os valores novos; os
// outros aparelhos recebem na próxima renovação (no máximo 1h).
export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Campos ausentes ou inválidos mantêm o valor atual: quem salva só o
    // tema não apaga as plataformas
    const settings = parseSettings(await req.json(), user.settings);

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { settings },
    });
    if (error) throw new Error(error.message);

    const res = NextResponse.json({ settings });

    const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
    const session = refreshToken ? await refreshSession(refreshToken) : null;
    if (session && session !== "invalid") setSessionCookies(res.cookies, session);

    return res;
  } catch (e) {
    console.error("PUT /api/settings:", errorText(e));
    return NextResponse.json({ error: errorText(e) }, { status: 500 });
  }
}
