import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { errorText } from "@/lib/errors";
import { APP_NAME } from "@/lib/constants";
import { getGames, type Game } from "@/lib/gamesData";
import { getSeries } from "@/lib/seriesData";
import { getChecklistProgress } from "@/lib/checklistsData";

// GET /api/export?format=json|csv — backup da coleção do usuário.
//   json: tudo (jogos, séries, progresso dos checklists), para guardar
//   csv:  só os jogos, para abrir em planilha

const CSV_COLUMNS: (keyof Game)[] = [
  "title", "platform", "game_status", "account_status", "platinum",
  "completion", "date", "genres", "themes", "notes", "igdb_id",
];

/** Uma célula CSV: aspas em volta e aspas internas dobradas. */
function csvCell(value: unknown): string {
  if (value == null) return "";
  const text = Array.isArray(value) ? value.join(", ") : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(games: Game[]): string {
  // ";" e BOM: o Excel em português abre com colunas e acentos certos
  const header = CSV_COLUMNS.join(";");
  const rows = games.map((g) => CSV_COLUMNS.map((c) => csvCell(g[c])).join(";"));
  return "﻿" + [header, ...rows].join("\r\n");
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const format = new URL(req.url).searchParams.get("format") === "csv" ? "csv" : "json";
    const day = new Date().toISOString().slice(0, 10);
    const filename = `${APP_NAME.toLowerCase()}-${day}.${format}`;
    const headers = {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    };

    if (format === "csv") {
      const games = await getGames(user.id);
      return new NextResponse(toCsv(games), {
        headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" },
      });
    }

    const [games, series, checklistProgress] = await Promise.all([
      getGames(user.id),
      getSeries(user.id),
      getChecklistProgress(user.id),
    ]);
    const body = JSON.stringify(
      { exportedAt: new Date().toISOString(), games, series, checklistProgress },
      null,
      2,
    );
    return new NextResponse(body, {
      headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (e) {
    console.error("GET /api/export:", errorText(e));
    return NextResponse.json({ error: errorText(e) }, { status: 500 });
  }
}
