import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { errorText } from "@/lib/errors";
import { addSeriesEntry, toggleSeriesEntry } from "@/lib/seriesData";

export async function PATCH(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, completed } = await req.json();
    await toggleSeriesEntry(Number(id), completed, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json({ error: errorText(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { seriesId, title } = await req.json();
    const entry = await addSeriesEntry(Number(seriesId), title, user.id);
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: errorText(e) }, { status: 500 });
  }
}
