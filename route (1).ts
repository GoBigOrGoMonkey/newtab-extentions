import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import JSZip from "jszip";
import { randomUUID } from "node:crypto";
import { addExtension } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json({ error: "Choose an extension .zip file." }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "ZIP files must be 20 MB or smaller." }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
    const manifestFile = zip.file("manifest.json");
    if (!manifestFile) return NextResponse.json({ error: "ZIP must contain manifest.json at its root." }, { status: 400 });

    let manifest: { name?: string; version?: string; description?: string; manifest_version?: number; icons?: Record<string, string> };
    try { manifest = JSON.parse(await manifestFile.async("string")); }
    catch { return NextResponse.json({ error: "manifest.json is not valid JSON." }, { status: 400 }); }

    if (!manifest.name || !manifest.version || ![2, 3].includes(Number(manifest.manifest_version))) {
      return NextResponse.json({ error: "Manifest needs a name, version, and manifest_version 2 or 3." }, { status: 400 });
    }

    const id = randomUUID();
    const blob = await put(`extensions/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`, bytes, {
      access: "public",
      contentType: "application/zip",
      addRandomSuffix: false,
    });

    const record = {
      id,
      name: String(manifest.name).slice(0, 100),
      version: String(manifest.version).slice(0, 40),
      description: String(manifest.description || "").slice(0, 500),
      manifest_version: Number(manifest.manifest_version),
      filename: file.name,
      size: file.size,
      blobUrl: blob.url,
      updatedAt: new Date().toISOString(),
    };
    await addExtension(record);
    return NextResponse.json({ extension: record }, { status: 201 });
  } catch (error) {
    console.error("Extension upload failed", error);
    return NextResponse.json({ error: "Upload failed. Check Vercel Blob and KV/Redis configuration." }, { status: 500 });
  }
}
