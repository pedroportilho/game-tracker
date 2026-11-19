import { NextResponse } from "next/server";
import { searchGames, getGame, toSearchResult } from "@/lib/igdb";
import { getUserFromRequest } from "@/lib/auth";
import { errorText } from "@/lib/errors";

export async function GET(request: Request) {
  // Só usuários logados: sem isso qualquer um usaria nossa cota da IGDB
  const user = await getUserFromRequest(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (!q || q.length > 100) return NextResponse.json([]);

    // Só dígitos: busca pelo ID da IGDB
    if (/^\d+$/.test(q)) {
      const game = await getGame(q);
      return NextResponse.json(game ? [toSearchResult(game)] : []);
    }

    const results = await searchGames(q, 10);
    return NextResponse.json(results.map(toSearchResult));
  } catch (err) {
    console.error("GET /api/igdb/search:", err);
    return NextResponse.json({ error: errorText(err) }, { status: 500 });
  }
}
