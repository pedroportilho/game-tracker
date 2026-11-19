import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { errorText } from "@/lib/errors";
import { createGame, pickGameInput, type GameInput } from "@/lib/gamesData";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const input = pickGameInput(await req.json()) as GameInput;
    const game = await createGame(input, user.id);
    return NextResponse.json(game, { status: 201 });
  } catch (e) {
    console.error("POST /api/games error:", errorText(e));
    return NextResponse.json({ error: errorText(e) }, { status: 500 });
  }
}
