import { NextResponse } from "next/server";
import { getExtension } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const extension = await getExtension(id);
  if (!extension) return NextResponse.json({ error: "Extension not found." }, { status: 404 });
  return NextResponse.redirect(extension.blobUrl);
}
