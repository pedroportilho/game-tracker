import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getGame, igdbImageUrl } from "@/lib/igdb";
import { getUserFromRequest } from "@/lib/auth";
import { errorText } from "@/lib/errors";
import type { Game } from "@/lib/gamesData";

// POST /api/igdb/sync-covers — manutenção, só para administradores.
// Preenche capa e temas dos jogos (do próprio admin) vinculados à IGDB que
// ainda não os têm. Jogos adicionados pelo formulário já vêm com os dois;
// isto serve para dados antigos ou importados. Faz uma consulta à IGDB por
// jogo (usa a cota das chaves do site), por isso não fica aberto a todos.
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Jogos com igdb_id sem capa ou com temas nunca consultados.
    // themes null = nunca consultado; [] = consultado e a IGDB não tem
    // nenhum — esses não entram, senão seriam reconsultados a cada clique.
    const { data: games, error } = await supabaseAdmin
      .from("games")
      .select("id, igdb_id, cover, themes")
      .eq("user_id", user.id)
      .not("igdb_id", "is", null)
      .or("cover.is.null,themes.is.null");

    if (error) throw new Error(error.message);
    if (!games || games.length === 0) {
      return NextResponse.json({ updated: 0, message: "Nothing to sync" });
    }

    let updated = 0;
    const errors: { id: string; error: string }[] = [];

    for (const game of games) {
      try {
        const igdbData = await getGame(game.igdb_id);
        if (!igdbData) continue;

        const cover_url = igdbImageUrl(igdbData.cover?.url, "cover_big");
        const themes = (igdbData.themes ?? []).map((t) => t.name);

        const patch: Partial<Pick<Game, "cover" | "themes">> = {};
        if (!game.cover && cover_url) patch.cover = cover_url;
        // Grava mesmo vazio: marca como consultado
        if (game.themes == null) patch.themes = themes;

        if (Object.keys(patch).length === 0) continue;

        const { error: updateError } = await supabaseAdmin
          .from("games")
          .update(patch)
          .eq("id", game.id)
          .eq("user_id", user.id);

        if (updateError) throw new Error(updateError.message);
        updated++;
      } catch (err) {
        errors.push({ id: game.id, error: errorText(err) });
      }
    }

    return NextResponse.json({
      updated,
      skipped: games.length - updated - errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("POST /api/igdb/sync-covers:", err);
    return NextResponse.json({ error: errorText(err) }, { status: 500 });
  }
}
