import { NextResponse } from "next/server";
import { getExtension, updateExtension } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const extension = await getExtension(id);
  if (!extension) return NextResponse.json({ error: "Extension not found." }, { status: 404 });
  return NextResponse.json({ extension });
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const existing = await getExtension(id);
  if (!existing) return NextResponse.json({ error: "Extension not found." }, { status: 404 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json({ error: "Choose a newer .zip file." }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "ZIP files must be 20 MB or smaller." }, { status: 413 });

    const JSZip = (await import("jszip")).default;
    const bytes = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
    const mf = zip.file("manifest.json");
    if (!mf) return NextResponse.json({ error: "ZIP must contain manifest.json at its root." }, { status: 400 });
    const manifest = JSON.parse(await mf.async("string"));
    if (!manifest.name || !manifest.version || ![2, 3].includes(Number(manifest.manifest_version))) {
      return NextResponse.json({ error: "Manifest needs a name, version, and manifest_version 2 or 3." }, { status: 400 });
    }

    const { put } = await import("@vercel/blob");
    const blob = await put(`extensions/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`, bytes, {
      access: "public", contentType: "application/zip", addRandomSuffix: false,
    });
    const updated = {
      ...existing,
      name: String(manifest.name).slice(0, 100),
      version: String(manifest.version).slice(0, 40),
      description: String(manifest.description || "").slice(0, 500),
      manifest_version: Number(manifest.manifest_version),
      filename: file.name,
      size: file.size,
      blobUrl: blob.url,
      updatedAt: new Date().toISOString(),
    };
    await updateExtension(updated);
    return NextResponse.json({ extension: updated });
  } catch {
    return NextResponse.json({ error: "Update failed. Ensure the ZIP and manifest are valid and storage is configured." }, { status: 400 });
  }
}
