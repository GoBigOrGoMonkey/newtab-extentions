"use client";

import { useEffect, useMemo, useState } from "react";

type ExtensionRecord = {
  id: string; name: string; version: string; description: string;
  manifest_version: number; filename: string; size: number;
  updatedAt: string;
};

const prettySize = (n: number) => n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;

export default function Home() {
  const [items, setItems] = useState<ExtensionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [updateId, setUpdateId] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/extensions", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load extensions.");
      setItems(data.extensions || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load extensions."); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => items.filter(x =>
    `${x.name} ${x.description}`.toLowerCase().includes(query.toLowerCase())), [items, query]);

  async function submit() {
    setError(""); setMessage("");
    if (!file) { setError("Choose an extension ZIP first."); return; }
    setBusy(true);
    try {
      const body = new FormData(); body.append("file", file);
      const endpoint = updateId ? `/api/extensions/${updateId}` : "/api/extensions/upload";
      const res = await fetch(endpoint, { method: updateId ? "PUT" : "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setMessage(`${data.extension.name} ${updateId ? "updated" : "published"} successfully.`);
      setFile(null); setUpdateId("");
      const picker = document.getElementById("zip-picker") as HTMLInputElement | null;
      if (picker) picker.value = "";
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <a href="/" className="flex items-center gap-3 no-underline text-white">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300 text-xl font-black text-black">V</span>
            <span><span className="block text-lg font-bold tracking-tight">Extension Vault</span><span className="block text-xs text-white/45">A home for your browser tools</span></span>
          </a>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60">CHROME EXTENSION LIBRARY</span>
        </header>

        <section className="grid gap-10 py-12 md:grid-cols-[1.15fr_.85fr] md:py-16">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.22em] text-lime-300">Your extensions, organized</p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.03] tracking-[-.055em] md:text-7xl">Find it.<br/>Update it.<br/><span className="text-lime-300">Keep moving.</span></h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/55">Upload a Chrome extension ZIP, publish it to the library, and replace it with a newer version when you’re ready.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/55"><span className="rounded-lg bg-white/[.05] px-3 py-2">Manifest V2 / V3</span><span className="rounded-lg bg-white/[.05] px-3 py-2">ZIP uploads</span><span className="rounded-lg bg-white/[.05] px-3 py-2">Versioned listings</span></div>
          </div>

          <section className="rounded-2xl border border-white/10 bg-[#11131a] p-5 shadow-2xl shadow-black/20 md:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-semibold">{updateId ? "Update extension" : "Publish an extension"}</h2><p className="mt-1 text-sm text-white/45">Upload a ZIP containing manifest.json.</p></div>
              <span className="rounded-lg bg-lime-300/10 px-2.5 py-1.5 text-xs font-semibold text-lime-300">MAX 20 MB</span>
            </div>
            <label htmlFor="zip-picker" className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[.025] p-5 text-center transition hover:border-lime-300/60">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white/[.07] text-xl">↑</span>
              <span className="font-medium">{file ? file.name : "Choose your extension ZIP"}</span>
              <span className="mt-1 text-xs text-white/40">{file ? prettySize(file.size) : "Click to browse files · .zip only"}</span>
              <input id="zip-picker" type="file" accept=".zip,application/zip" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
            <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-white/45" htmlFor="update-select">Publishing mode</label>
            <select id="update-select" value={updateId} onChange={e => setUpdateId(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#0a0b10] px-3 py-3 text-sm text-white outline-none focus:border-lime-300/60">
              <option value="">Publish as a new extension</option>
              {items.map(item => <option key={item.id} value={item.id}>Update: {item.name} (v{item.version})</option>)}
            </select>
            <button disabled={busy || !file} onClick={submit} className="mt-4 w-full rounded-lg bg-lime-300 px-4 py-3.5 text-sm font-bold text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40">{busy ? "Uploading…" : updateId ? "Upload new version" : "Publish extension"}</button>
            {message && <p role="status" className="mt-3 rounded-lg bg-lime-300/10 p-3 text-sm text-lime-200">{message}</p>}
            {error && <p role="alert" className="mt-3 rounded-lg bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}
            <p className="mt-4 text-xs leading-5 text-white/35">Only upload extensions you have permission to distribute. This starter does not yet include publisher accounts or moderation.</p>
          </section>
        </section>

        <section className="border-t border-white/10 pt-8 pb-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">The library</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Available extensions <span className="text-white/35">({items.length})</span></h2></div>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search extensions…" className="w-full rounded-lg border border-white/10 bg-[#11131a] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-lime-300/50 sm:w-64"/>
          </div>
          {loading ? <p className="py-10 text-sm text-white/45">Loading library…</p> : filtered.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 py-14 text-center"><p className="font-medium">{items.length ? "No matching extensions" : "The library is empty"}</p><p className="mt-2 text-sm text-white/40">{items.length ? "Try another search." : "Publish your first ZIP above to get started."}</p></div> :
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(item => <article key={item.id} className="flex flex-col rounded-xl border border-white/10 bg-[#11131a] p-5 transition hover:border-white/20">
                <div className="flex items-start justify-between gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[.06] text-lg font-bold">{item.name.trim().charAt(0).toUpperCase()}</div><span className="rounded-md bg-white/[.06] px-2 py-1 text-xs text-white/55">v{item.version}</span></div>
                <h3 className="mt-4 text-lg font-semibold">{item.name}</h3>
                <p className="mt-2 min-h-10 flex-1 text-sm leading-6 text-white/45">{item.description || "No description provided."}</p>
                <div className="mt-5 flex items-center justify-between border-t border-white/[.07] pt-4 text-xs text-white/35"><span>{prettySize(item.size)}</span><span>{new Date(item.updatedAt).toLocaleDateString()}</span></div>
                <a href={`/api/extensions/${item.id}/download`} className="mt-4 rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm font-semibold text-white no-underline transition hover:border-lime-300/50 hover:text-lime-200">Download ZIP ↓</a>
                <button onClick={() => { setUpdateId(item.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="mt-2 text-xs text-white/40 hover:text-white">Replace this version ↑</button>
              </article>)}
            </div>}
        </section>
        <footer className="flex flex-wrap justify-between gap-3 border-t border-white/10 py-6 text-xs text-white/30"><span>Extension Vault · Community library</span><span>Next.js · Vercel</span></footer>
      </div>
    </main>
  );
}
