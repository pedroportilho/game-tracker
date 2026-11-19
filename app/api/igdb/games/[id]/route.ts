import { NextResponse } from "next/server";
import { getGame, toGameDetails } from "@/lib/igdb";
import { getUserFromRequest } from "@/lib/auth";
import { errorText } from "@/lib/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Só usuários logados: sem isso qualquer um usaria nossa cota da IGDB
  const user = await getUserFromRequest(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const game = await getGame(id);
    if (!game)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(toGameDetails(game));
  } catch (err) {
    console.error("GET /api/igdb/games/[id]:", err);
    return NextResponse.json({ error: errorText(err) }, { status: 500 });
  }
}
