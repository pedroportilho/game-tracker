import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getGame, igdbImageUrl } from "@/lib/igdb";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  // Antes não exigia login e mexia nos jogos de TODOS os usuários.
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Jogos DO USUÁRIO que têm igdb_id mas faltam cover ou themes
    const { data: games, error } = await supabaseAdmin
      .from("games")
      .select("id, igdb_id, cover, themes")
      .eq("user_id", user.id)
      .not("igdb_id", "is", null)
      .or("cover.is.null,themes.is.null,themes.eq.{}");

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
        const themes = (igdbData.themes ?? []).map((t: any) => t.name);

        const patch: Record<string, any> = {};
        if (!game.cover && cover_url) patch.cover = cover_url;
        if ((!game.themes || game.themes.length === 0) && themes.length > 0)
          patch.themes = themes;

        if (Object.keys(patch).length === 0) continue;

        const { error: updateError } = await supabaseAdmin
          .from("games")
          .update(patch)
          .eq("id", game.id)
          .eq("user_id", user.id);

        if (updateError) throw new Error(updateError.message);
        updated++;
      } catch (err: any) {
        errors.push({ id: game.id, error: err.message });
      }
    }

    return NextResponse.json({
      updated,
      skipped: games.length - updated - errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("POST /api/igdb/sync-covers:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
