import { NextResponse } from "next/server";
import { listExtensions } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ extensions: await listExtensions() });
  } catch {
    return NextResponse.json({ error: "Storage is not configured. Add the required Vercel Blob environment variables." }, { status: 503 });
  }
}
