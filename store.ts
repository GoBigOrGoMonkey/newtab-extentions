import { Redis } from "@upstash/redis";

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

const redis = Redis.fromEnv();
const INDEX = "extension-vault:index";
const key = (id: string) => `extension-vault:item:${id}`;

export async function listExtensions(): Promise<ExtensionRecord[]> {
  const ids = await redis.smembers<string[]>(INDEX);
  const records = await Promise.all(ids.map((id) => redis.get<ExtensionRecord>(key(id))));
  return records.filter((x): x is ExtensionRecord => Boolean(x))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function getExtension(id: string): Promise<ExtensionRecord | null> {
  return (await redis.get<ExtensionRecord>(key(id))) || null;
}
export async function addExtension(record: ExtensionRecord) {
  await redis.set(key(record.id), record);
  await redis.sadd(INDEX, record.id);
}
export async function updateExtension(record: ExtensionRecord) {
  await redis.set(key(record.id), record);
}
