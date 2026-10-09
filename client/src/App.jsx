import { useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";

const TYPES = ["Blog post", "LinkedIn post", "Email newsletter", "Product description", "Ad copy", "Video script"];
const TONES = ["Professional", "Friendly", "Persuasive", "Witty", "Authoritative"];
const LENGTHS = ["Short", "Medium", "Long"];

function AuthForm({ onDone }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const data = mode === "login" ? await api.login(f) : await api.register(f);
      setToken(data.token);
      onDone(data.user);
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <main className="auth">
      <form onSubmit={submit}>
        <h1>Draftroom</h1>
        <p className="muted">Generate, refine and keep your marketing copy in one place.</p>
        {mode === "register" && <label>Name<input value={f.name} onChange={set("name")} required /></label>}
        <label>Email<input type="email" value={f.email} onChange={set("email")} required /></label>
        <label>Password<input type="password" value={f.password} onChange={set("password")} minLength={6} required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        <button type="button" className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}

function Generator({ onCreated, onError }) {
  const [f, setF] = useState({ type: TYPES[0], topic: "", tone: TONES[0], length: "Medium", audience: "", keywords: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); onError("");
    try { onCreated(await api.generate(f)); setF({ ...f, topic: "" }); }
    catch (err) { onError(err.message, err.status); }
    setBusy(false);
  }

  return (
    <form className="gen" onSubmit={submit}>
      <h2>What should we write?</h2>
      <div className="row">
        <label>Format<select value={f.type} onChange={set("type")}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>Tone<select value={f.tone} onChange={set("tone")}>{TONES.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>Length<select value={f.length} onChange={set("length")}>{LENGTHS.map((t) => <option key={t}>{t}</option>)}</select></label>
      </div>
      <label>Topic<textarea rows={3} value={f.topic} onChange={set("topic")} placeholder="e.g. Why small bakeries should start a weekly email list" required /></label>
      <div className="row">
        <label>Audience <span className="muted">(optional)</span><input value={f.audience} onChange={set("audience")} /></label>
        <label>Keywords <span className="muted">(optional, comma separated)</span><input value={f.keywords} onChange={set("keywords")} /></label>
      </div>
      <button className="primary" disabled={busy}>{busy ? "Writing your draft…" : "Generate draft"}</button>
    </form>
  );
}

function Editor({ item, onChange, onDelete, onError }) {
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  const [tone, setTone] = useState(TONES[0]);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const dirty = title !== item.title || body !== item.body;

  useEffect(() => { setTitle(item.title); setBody(item.body); setNote(""); }, [item._id, item.updatedAt]);

  async function save() {
    setBusy("save");
    try { onChange(await api.save(item._id, { title, body })); setNote("Saved"); }
    catch (e) { onError(e.message, e.status); }
    setBusy("");
  }
  async function transform(action) {
    setBusy(action); setNote("");
    try { onChange(await api.transform(item._id, { action, text: body, tone })); setNote("Draft updated"); }
    catch (e) { onError(e.message, e.status); }
    setBusy("");
  }
  const copy = async () => { await navigator.clipboard.writeText(body); setNote("Copied to clipboard"); };
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <section className="editor">
      <input className="title" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
      <p className="muted">{item.type} · {words} words</p>
      <div className="tools">
        {["improve", "shorten", "expand"].map((a) => (
          <button key={a} disabled={!!busy} onClick={() => transform(a)}>{busy === a ? "Working…" : a[0].toUpperCase() + a.slice(1)}</button>
        ))}
        <select value={tone} onChange={(e) => setTone(e.target.value)} aria-label="Tone">{TONES.map((t) => <option key={t}>{t}</option>)}</select>
        <button disabled={!!busy} onClick={() => transform("tone")}>{busy === "tone" ? "Working…" : "Change tone"}</button>
      </div>
      <textarea className="body" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="tools">
        <button className="primary" disabled={!dirty || !!busy} onClick={save}>{busy === "save" ? "Saving…" : "Save changes"}</button>
        <button onClick={copy}>Copy text</button>
        <button className="danger" onClick={() => confirm("Delete this draft?") && onDelete(item._id)}>Delete</button>
        <span className="muted" role="status">{note}</span>
      </div>
    </section>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const logout = () => { setToken(null); setUser(null); setItems([]); setActiveId(null); };
  const fail = (msg, status) => (status === 401 ? logout() : setError(msg));

  useEffect(() => {
    if (!getToken()) return setReady(true);
    api.list().then((l) => { setItems(l); setUser({ name: "you" }); }).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => api.list(q).then(setItems).catch((e) => fail(e.message, e.status)), 250);
    return () => clearTimeout(t);
  }, [q, user]);

  const upsert = (doc) => { setItems((l) => [doc, ...l.filter((i) => i._id !== doc._id)]); setActiveId(doc._id); setError(""); };
  async function remove(id) {
    try { await api.remove(id); setItems((l) => l.filter((i) => i._id !== id)); setActiveId(null); }
    catch (e) { fail(e.message, e.status); }
  }

  if (!ready) return null;
  if (!user) return <AuthForm onDone={(u) => { setUser(u); api.list().then(setItems); }} />;
  const active = items.find((i) => i._id === activeId);

  return (
    <div className="app">
      <aside>
        <header><strong>Draftroom</strong><button className="link" onClick={logout}>Sign out</button></header>
        <button className="primary" onClick={() => setActiveId(null)}>New draft</button>
        <input type="search" placeholder="Search drafts" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search drafts" />
        <ul>
          {items.map((i) => (
            <li key={i._id}>
              <button className={i._id === activeId ? "item active" : "item"} onClick={() => setActiveId(i._id)}>
                <span>{i.title}</span><small>{i.type} · {new Date(i.updatedAt).toLocaleDateString()}</small>
              </button>
            </li>
          ))}
          {!items.length && <li className="muted empty">{q ? "No drafts match that search." : "No drafts yet. Describe a topic to write your first one."}</li>}
        </ul>
      </aside>
      <main>
        {error && <p className="error" role="alert">{error}</p>}
        {active ? <Editor item={active} onChange={upsert} onDelete={remove} onError={fail} /> : <Generator onCreated={upsert} onError={fail} />}
      </main>
    </div>
  );
}
