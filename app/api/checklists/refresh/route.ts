import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getUserFromRequest } from "@/lib/auth";
import { CHECKLIST_CACHE_TAG } from "@/lib/checklistsData";

// POST /api/checklists/refresh — só administradores.
// A estrutura dos checklists (franquias, jogos, seções, itens) fica em cache
// por 1 hora. Depois de mexer nela direto no banco, isto faz a mudança
// aparecer na hora, para todos os usuários.
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  revalidateTag(CHECKLIST_CACHE_TAG);
  return NextResponse.json({ ok: true });
}
