import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { errorText } from "@/lib/errors";
import { createSeries } from "@/lib/seriesData";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name } = await req.json();
    const s = await createSeries(name, user.id);
    return NextResponse.json(s, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: errorText(e) }, { status: 500 });
  }
}
