import { kv } from "@vercel/kv";

export type ExtensionRecord = {
  id: string;
  name: string;
  version: string;
  description: string;
  manifest_version: number;
  filename: string;
  size: number;
  blobUrl: string;
  updatedAt: string;
};

const INDEX = "extension-vault:index";
const key = (id: string) => `extension-vault:item:${id}`;

export async function listExtensions(): Promise<ExtensionRecord[]> {
  const ids = await kv.smembers(INDEX) as string[];
  const records = await Promise.all(ids.map((id) => kv.get<ExtensionRecord>(key(id))));
  return records.filter((x): x is ExtensionRecord => Boolean(x))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function getExtension(id: string): Promise<ExtensionRecord | null> {
  return (await kv.get<ExtensionRecord>(key(id))) || null;
}
export async function addExtension(record: ExtensionRecord) {
  await kv.set(key(record.id), record);
  await kv.sadd(INDEX, record.id);
}
export async function updateExtension(record: ExtensionRecord) {
  await kv.set(key(record.id), record);
}
