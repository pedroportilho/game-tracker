import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { setChecklistProgress } from "@/lib/checklistsData";

// PATCH { itemId: string, value: number } → { value }
export async function PATCH(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { itemId, value } = await req.json();
    if (typeof itemId !== "string" || typeof value !== "number") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const saved = await setChecklistProgress(user.id, itemId, value);
    return NextResponse.json({ value: saved });
  } catch (e: any) {
    const status = /Invalid|exceeds|not found/i.test(e.message) ? 400 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
