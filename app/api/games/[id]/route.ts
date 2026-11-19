import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { errorText } from "@/lib/errors";
import { updateGame, deleteGame, pickGameInput } from "@/lib/gamesData";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const data = pickGameInput(await req.json());
    const game = await updateGame(id, data, user.id);
    return NextResponse.json(game);
  } catch (e) {
    console.error("PUT /api/games error:", errorText(e));
    return NextResponse.json({ error: errorText(e) }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await deleteGame(id, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json({ error: errorText(e) }, { status: 500 });
  }
}
