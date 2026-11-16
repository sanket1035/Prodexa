import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

type Repo = { id: string; full_name: string };
type Issue = {
  id: string; number: number | null; title: string; state: string; labels: string[];
  html_url: string | null; prediction: { category: string; score: number; uncertain: boolean } | null;
};
type Page = { items: Issue[]; total: number; page: number; page_size: number };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, { credentials: "same-origin", ...init });
  if (!r.ok) throw new Error(`${r.status}: ${(await r.json().catch(() => ({}))).detail ?? r.statusText}`);
  return r.json();
}

function App() {
  const [user, setUser] = useState<string | null | undefined>(undefined);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoId, setRepoId] = useState("");
  const [fullName, setFullName] = useState("");
  const [state, setState] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [msg, setMsg] = useState("");
  const [reload, setReload] = useState(0);

  const loadRepos = useCallback(() => api<Repo[]>("/api/v1/repositories").then((r) => {
    setRepos(r); setRepoId((cur) => cur || r[0]?.id || "");
  }), []);

  useEffect(() => {
    api<{ github_login: string }>("/api/v1/auth/me").then((m) => { setUser(m.github_login); loadRepos(); }).catch(() => setUser(null));
  }, [loadRepos]);

  useEffect(() => {
    if (!repoId) return;
    const p = new URLSearchParams({ page: String(page) });
    if (state) p.set("state", state);
    if (q) p.set("q", q);
    api<Page>(`/api/v1/repositories/${repoId}/issues?${p}`).then(setData).catch((e) => setMsg(String(e)));
  }, [repoId, state, q, page, reload]);

  const run = (fn: () => Promise<unknown>) => { setMsg("Working…"); fn().then(() => setMsg("Done")).catch((e) => setMsg(String(e))); };
  const connect = () => run(async () => {
    const r = await api<Repo>("/api/v1/repositories/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: fullName }) });
    await loadRepos(); setRepoId(r.id);
  });
  const sync = () => run(async () => { await api(`/api/v1/repositories/${repoId}/sync`, { method: "POST" }); setReload((n) => n + 1); });
  const classify = (id: string) => run(async () => {
    const p = await api<NonNullable<Issue["prediction"]>>(`/api/v1/issues/${id}/classify`, { method: "POST" });
    setData((d) => d && { ...d, items: d.items.map((i) => (i.id === id ? { ...i, prediction: p } : i)) });
  });

  const box = { fontFamily: "system-ui", maxWidth: 900, margin: "2rem auto", padding: "0 1rem" } as const;
  if (user === undefined) return <main style={box}>Loading…</main>;
  if (user === null) return (
    <main style={box}><h1>Prodexa</h1><p>Engineering intelligence for GitHub repositories.</p>
      <a href="/api/v1/auth/github/login">Sign in with GitHub</a></main>
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  return (
    <main style={box}>
      <h1>Prodexa</h1>
      <p>Signed in as {user}. <button onClick={() => api("/api/v1/auth/logout", { method: "POST" }).then(() => setUser(null))}>Sign out</button></p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input placeholder="owner/repo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <button onClick={connect} disabled={!fullName}>Connect</button>
        <select value={repoId} onChange={(e) => { setRepoId(e.target.value); setPage(1); }}>
          {repos.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
        </select>
        <button onClick={sync} disabled={!repoId}>Sync issues</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input placeholder="Search title or body" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select value={state} onChange={(e) => { setState(e.target.value); setPage(1); }}>
          <option value="">All</option><option value="open">Open</option><option value="closed">Closed</option>
        </select>
      </div>
      <p>{msg}</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th align="left">#</th><th align="left">Title</th><th align="left">State</th><th align="left">Labels</th><th align="left">Category</th></tr></thead>
        <tbody>
          {data?.items.map((i) => (
            <tr key={i.id} style={{ borderTop: "1px solid #ddd" }}>
              <td>{i.number}</td>
              <td>{i.html_url ? <a href={i.html_url} target="_blank" rel="noreferrer">{i.title}</a> : i.title}</td>
              <td>{i.state}</td><td>{i.labels.join(", ")}</td>
              <td>{i.prediction ? `${i.prediction.category} (${i.prediction.score.toFixed(2)}${i.prediction.uncertain ? ", uncertain" : ""})` : <button onClick={() => classify(i.id)}>Classify</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{data ? `${data.total} issues` : ""} · page {page} of {pages}{" "}
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>{" "}
        <button disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
