import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { updateEntriesOrder } from "@/lib/supabase";

export async function PATCH(req: Request) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { entries } = await req.json();

    if (
      !Array.isArray(entries) ||
      !entries.every((entry) => Number.isInteger(entry.id))
    ) {
      return NextResponse.json({ error: "Invalid entries" }, { status: 400 });
    }

    await updateEntriesOrder(entries, user.id);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
