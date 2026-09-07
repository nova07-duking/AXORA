import Messaging from "../components/Messaging";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  CalendarDays,
  Building2,
  Layers,
  Search,
  ArrowUpRight,
  ArrowLeft,
  RefreshCw,
  Inbox,
  Users,
  Clock,
  CheckCircle2,
  LogOut,
  PanelsTopLeft,
  MessageCircle,
} from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSite } from "../context/SiteContext";
import {
  Field,
  Errors,
  Pagination,
  Status,
  labels,
  dateLabel,
} from "../components/UI";
function useEditorGuard(key, dirty, busy, onState) {
  useEffect(() => {
    onState?.(key, { dirty, busy });
  }, [key, dirty, busy, onState]);
  useEffect(() => () => onState?.(key, null), [key, onState]);
}
function EditorForm({ busy, children, ...props }) {
  return (
    <form {...props}>
      <fieldset disabled={busy} className="form-stack">
        {children}
      </fieldset>
    </form>
  );
}
function RequestEditor({ item, kind, onSaved, onState }) {
  const [status, setStatus] = useState(item.status),
    [reply, setReply] = useState(item.reply || ""),
    [url, setUrl] = useState(item.meeting_url || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  useEditorGuard(
    "request",
    status !== item.status ||
      reply !== (item.reply || "") ||
      url !== (item.meeting_url || ""),
    busy,
    onState,
  );
  const choices =
    kind === "appointment"
      ? ["nouveau", "confirme", "termine", "annule"]
      : ["nouveau", "en_cours", "traite", "annule"];
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.updateRequest(kind, item.id, {
        status,
        reply,
        meeting_url: url || null,
      });
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="card">
      <div className="card-top">
        <div>
          <span className="eyebrow">
            #{item.id} · {item.user?.name}
          </span>
          <h2>{item.subject || item.service?.name}</h2>
        </div>
        <Status value={item.status} />
      </div>
      <p>
        <a className="text-link" href={"mailto:" + item.user?.email}>
          {item.user?.email}
        </a>
        {item.user?.phone && " · " + item.user.phone}
      </p>
      {item.user?.company_name && (
        <p>
          <strong>Organisation :</strong> {item.user.company_name}
        </p>
      )}
      <p className="help">
        Demande reçue le {dateLabel(item.created_at)} (Libreville).
      </p>
      <p className="preserve">{item.message}</p>
      {item.budget_estimatif && <p>Budget : {item.budget_estimatif}</p>}
      {item.audit_type && (
        <p>
          Périmètre : {item.audit_type} · {item.organization_size} personnes
        </p>
      )}
      {item.preferred_at && (
        <p className="schedule">
          {dateLabel(item.preferred_at)} (Libreville) · {item.meeting_mode}
        </p>
      )}
      <EditorForm busy={busy} className="form-stack reply" onSubmit={save}>
        <Field label="Statut">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {choices.map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Réponse visible par le client">
          <textarea
            maxLength={10000}
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
        </Field>
        {kind === "appointment" && (
          <Field label="Lien de visioconférence (facultatif)">
            <input
              type="url"
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
        )}
        <Errors error={error} />
        <button className="btn" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer la réponse"}
        </button>
      </EditorForm>
    </article>
  );
}
function CompanyEditor({ onState }) {
  const { site, reload, error: loadError, applySite } = useSite();
  const [changed, setChanged] = useState(false);
  const [form, setForm] = useState(null),
    [error, setError] = useState(null),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  useEditorGuard("company", changed, busy, onState);
  useEffect(() => {
    if (site) setForm(structuredClone(site.company));
  }, [site]);
  if (!form)
    return loadError ? (
      <>
        <Errors error={loadError} />
        <button className="btn" onClick={reload}>
          Réessayer
        </button>
      </>
    ) : (
      <p>Chargement des informations…</p>
    );
  const change = (k, v) => {
    setChanged(true);
    setSaved(false);
    setForm((f) => ({ ...f, [k]: v }));
  };
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      applySite(await api.updateSite(form));
      setChanged(false);
      setSaved(true);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <EditorForm busy={busy} className="card form-stack" onSubmit={save}>
      <h2>Informations de l’entreprise</h2>
      <p>
        Les modifications sont affichées sur les pages publiques après
        enregistrement.
      </p>
      <div className="form-grid">
        {[
          ["name", "Nom"],
          ["city", "Ville et pays"],
          ["email", "Email"],
          ["phone", "Téléphone"],
          ["address", "Adresse exacte"],
          ["maps_url", "Lien Google Maps"],
          ["hours", "Horaires d’accueil"],
        ].map(([k, l]) => (
          <Field label={l} key={k}>
            <input
              required={["name", "city", "email"].includes(k)}
              type={k === "email" ? "email" : k === "maps_url" ? "url" : "text"}
              value={form[k] || ""}
              onChange={(e) => change(k, e.target.value)}
            />
          </Field>
        ))}
      </div>
      {["history", "mission", "vision"].map((k, i) => (
        <Field
          key={k}
          label={["Histoire de l’entreprise", "Mission", "Vision"][i]}
        >
          <textarea
            required
            rows={k === "history" ? 5 : 3}
            value={form[k]}
            onChange={(e) => change(k, e.target.value)}
          />
        </Field>
      ))}
      <Field label="Objectifs — un objectif par ligne">
        <textarea
          required
          rows={4}
          value={form.objectives.join("\n")}
          onChange={(e) => change("objectives", e.target.value.split("\n"))}
        />
      </Field>
      <h2>Présentation de l’équipe</h2>
      {form.team.map((m, i) => (
        <fieldset className="card form-stack" key={i}>
          <legend>Membre {i + 1}</legend>
          {[
            ["name", "Nom"],
            ["role", "Rôle"],
            ["bio", "Présentation"],
            ["photo_url", "URL HTTPS de la photo"],
          ].map(([k, l]) => (
            <Field label={l} key={k}>
              <input
                required={k === "name" || k === "role"}
                type={k === "photo_url" ? "url" : "text"}
                value={m[k] || ""}
                onChange={(e) =>
                  change(
                    "team",
                    form.team.map((v, j) =>
                      j === i ? { ...v, [k]: e.target.value } : v,
                    ),
                  )
                }
              />
            </Field>
          ))}
          <button
            type="button"
            className="text-link danger"
            onClick={() =>
              change(
                "team",
                form.team.filter((_, j) => j !== i),
              )
            }
          >
            Retirer ce membre
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="btn secondary"
        disabled={form.team.length >= 30}
        onClick={() =>
          change("team", [
            ...form.team,
            { name: "", role: "", bio: "", photo_url: "" },
          ])
        }
      >
        Ajouter une personne
      </button>
      <Errors error={error} />
      {saved && (
        <p className="notice" role="status">
          Informations enregistrées.
        </p>
      )}
      <button className="btn" disabled={busy}>
        {busy ? "Enregistrement…" : "Enregistrer les informations"}
      </button>
    </EditorForm>
  );
}
function ServiceEditor({ service, onState }) {
  const [baseline, setBaseline] = useState(service);
  const [form, setForm] = useState(service),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [saved, setSaved] = useState(false);
  useEditorGuard(
    "service-" + service.id,
    JSON.stringify(form) !== JSON.stringify(baseline),
    busy,
    onState,
  );
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await api.updateService(form.id, {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        deliverables: form.deliverables,
      });
      setForm(updated);
      setBaseline(updated);
      setSaved(true);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <EditorForm busy={busy} className="card form-stack" onSubmit={save}>
      <h2>{service.name}</h2>
      {[
        ["name", "Nom"],
        ["tagline", "Accroche"],
        ["description", "Description"],
      ].map(([k, l]) => (
        <Field label={l} key={k}>
          {k === "description" ? (
            <textarea
              required
              rows={4}
              value={form[k]}
              onChange={(e) => {
                setSaved(false);
                setForm({ ...form, [k]: e.target.value });
              }}
            />
          ) : (
            <input
              required
              value={form[k]}
              onChange={(e) => {
                setSaved(false);
                setForm({ ...form, [k]: e.target.value });
              }}
            />
          )}
        </Field>
      ))}
      <Field label="Prestations incluses — une ligne par élément">
        <textarea
          required
          rows={4}
          value={(form.deliverables || []).join("\n")}
          onChange={(e) => {
            setSaved(false);
            setForm({ ...form, deliverables: e.target.value.split("\n") });
          }}
        />
      </Field>
      <Errors error={error} />
      {saved && <p role="status">Service enregistré.</p>}
      <button className="btn" disabled={busy}>
        {busy ? "Enregistrement…" : "Enregistrer le service"}
      </button>
    </EditorForm>
  );
}
function PageContentEditor({ onState }) {
  const { site, reload, error: loadError, applySite } = useSite();
  const [changed, setChanged] = useState(false);
  const [form, setForm] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [saved, setSaved] = useState(false);
  useEditorGuard("pages", changed, busy, onState);
  useEffect(() => {
    if (site?.pages) setForm(structuredClone(site.pages));
  }, [site]);
  if (!form)
    return loadError ? (
      <>
        <Errors error={loadError} />
        <button className="btn" onClick={reload}>
          Réessayer
        </button>
      </>
    ) : (
      <p>Chargement des contenus…</p>
    );
  const change = (page, key, value) => {
    setChanged(true);
    setSaved(false);
    setForm((current) => ({
      ...current,
      [page]: { ...current[page], [key]: value },
    }));
  };
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      applySite(await api.updateSite({ ...site.company, pages: form }));
      setChanged(false);
      setSaved(true);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  const textField = (page, key, label, multiline = false) => (
    <Field label={label} key={key}>
      {multiline ? (
        <textarea
          required
          rows={3}
          value={form[page][key] || ""}
          onChange={(e) => change(page, key, e.target.value)}
        />
      ) : (
        <input
          required
          value={form[page][key] || ""}
          onChange={(e) => change(page, key, e.target.value)}
        />
      )}
    </Field>
  );
  const urlField = (page, key, label) => (
    <Field
      label={label}
      key={key}
      hint="Laisser vide pour conserver l’image locale."
    >
      <input
        type="url"
        value={form[page][key] || ""}
        onChange={(e) => change(page, key, e.target.value)}
        placeholder="https://"
      />
    </Field>
  );
  return (
    <EditorForm busy={busy} className="form-stack" onSubmit={save}>
      <section className="card form-stack">
        <div className="admin-section-title">
          <div>
            <h2>Page d’accueil</h2>
            <p>Modifiez les textes visibles sur la première page.</p>
          </div>
          <PanelsTopLeft size={22} />
        </div>
        <div className="form-grid">
          {textField("home", "hero_eyebrow", "Sur-titre")}
          {textField("home", "hero_note", "Public concerné")}
          {urlField("home", "hero_image", "Image principale")}
          {urlField("home", "story_image", "Image de présentation")}
        </div>
        {textField("home", "hero_title", "Titre principal")}
        {textField("home", "hero_emphasis", "Mise en valeur du titre")}
        {textField("home", "hero_lead", "Introduction", true)}
        <div className="form-grid">
          {textField("home", "method_eyebrow", "Sur-titre de la méthode")}
          {textField("home", "method_title", "Titre de la méthode")}
        </div>
        {textField("home", "method_intro", "Introduction de la méthode", true)}
        <h3>Étapes de la méthode</h3>
        {form.home.method_steps.map((step, i) => (
          <fieldset className="card form-stack" key={i}>
            <legend>Étape {i + 1}</legend>
            <div className="form-grid">
              <Field label="Numéro">
                <input
                  required
                  value={step.number}
                  onChange={(e) => {
                    const steps = [...form.home.method_steps];
                    steps[i] = { ...step, number: e.target.value };
                    change("home", "method_steps", steps);
                  }}
                />
              </Field>
              <Field label="Titre">
                <input
                  required
                  value={step.title}
                  onChange={(e) => {
                    const steps = [...form.home.method_steps];
                    steps[i] = { ...step, title: e.target.value };
                    change("home", "method_steps", steps);
                  }}
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                required
                rows={2}
                value={step.text}
                onChange={(e) => {
                  const steps = [...form.home.method_steps];
                  steps[i] = { ...step, text: e.target.value };
                  change("home", "method_steps", steps);
                }}
              />
            </Field>
          </fieldset>
        ))}
        <div className="form-grid">
          {textField("home", "story_eyebrow", "Sur-titre de présentation")}
          {textField("home", "story_title", "Titre de présentation")}
        </div>
        {textField("home", "story_text", "Texte de présentation", true)}
        <div className="form-grid">
          {textField("home", "cta_eyebrow", "Sur-titre de conclusion")}
          {textField("home", "cta_title", "Titre de conclusion")}
        </div>
        {textField("home", "cta_text", "Texte de conclusion", true)}
      </section>
      <section className="card form-stack">
        <h2>Page À propos</h2>
        {urlField("about", "image", "Image de la page")}
        <div className="form-grid">
          {textField("about", "eyebrow", "Sur-titre")}
          {textField("about", "story_title", "Titre de l’histoire")}
          {textField("about", "mission_title", "Titre de la mission")}
          {textField("about", "vision_title", "Titre de la vision")}
          {textField("about", "objectives_eyebrow", "Sur-titre des objectifs")}
          {textField("about", "objectives_title", "Titre des objectifs")}
          {textField("about", "team_eyebrow", "Sur-titre de l’équipe")}
          {textField("about", "team_title", "Titre de l’équipe")}
          {textField("about", "banner_title", "Titre de conclusion")}
          {textField("about", "banner_text", "Texte de conclusion", true)}
        </div>
        {textField("about", "title", "Titre principal")}
        {textField("about", "lead", "Introduction", true)}
      </section>
      <section className="card form-stack">
        <h2>Page Contact</h2>
        <div className="form-grid">
          {textField("contact", "eyebrow", "Sur-titre")}
          {textField("contact", "needs_title", "Titre des besoins")}
        </div>
        {textField("contact", "title", "Titre principal")}
        {textField("contact", "lead", "Introduction", true)}
      </section>
      <section className="card form-stack">
        <h2>Pied de page</h2>
        {textField("footer", "tagline", "Signature")}
        {textField("footer", "description", "Description")}
      </section>
      <Errors error={error} />
      {saved && (
        <p className="notice" role="status">
          Contenus enregistrés.
        </p>
      )}
      <button className="btn" disabled={busy}>
        {busy ? "Enregistrement…" : "Enregistrer tous les contenus"}
      </button>
    </EditorForm>
  );
}
const SECTIONS = [
  ["messages", "Messagerie clients", MessageCircle],
  ["dashboard", "Vue d’ensemble", LayoutDashboard],
  ["quote", "Devis", FileText],
  ["audit", "Audits", ShieldCheck],
  ["appointment", "Rendez-vous", CalendarDays],
  ["company", "Entreprise & équipe", Building2],
  ["services", "Catalogue des services", Layers],
  ["pages", "Pages publiques", PanelsTopLeft],
];
const KIND_LABEL = {
  quote: "Devis",
  audit: "Audit",
  appointment: "Rendez-vous",
};
function Overview({ data, site, onNavigate, onOpen }) {
  const total = Object.values(data.totals).reduce(
    (sum, n) => sum + Number(n),
    0,
  );
  const tasks = site
    ? [
        ["Adresse exacte", !!site.company.address],
        ["Téléphone", !!site.company.phone],
        ["Itinéraire Google Maps", !!site.company.maps_url],
        ["Horaires d’accueil", !!site.company.hours],
      ]
    : [];
  return (
    <>
      <div className="admin-metrics">
        {[
          [
            Inbox,
            data.pending,
            "Demandes à traiter",
            "Statut reçu",
            "attention",
          ],
          [Clock, data.active, "Dossiers en cours", "Devis et audits", "blue"],
          [
            CalendarDays,
            data.upcoming_count,
            "Rendez-vous à venir",
            "Confirmés par l’équipe",
            "teal",
          ],
          [
            Users,
            data.clients,
            "Comptes clients",
            "Hors administrateurs",
            "purple",
          ],
        ].map(([Icon, value, label, hint, tint]) => (
          <article className={"admin-metric " + tint} key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <Icon size={20} />
            </div>
            <strong>{value}</strong>
            <small>{hint}</small>
          </article>
        ))}
      </div>
      <div className="admin-overview-grid">
        <section className="card">
          <div className="admin-section-title">
            <div>
              <h2>Dernières demandes</h2>
              <p>Les six dossiers les plus récents.</p>
            </div>
            <Inbox size={22} />
          </div>
          {data.recent.length === 0 ? (
            <div className="admin-empty">
              <Inbox size={32} />
              <h3>Votre activité commence ici</h3>
              <p>Les demandes de vos clients apparaîtront dans cette liste.</p>
              <Link className="text-link" to="/services">
                Voir les services proposés →
              </Link>
            </div>
          ) : (
            <div className="admin-recent">
              {data.recent.map((item) => (
                <button key={item.kind + item.id} onClick={() => onOpen(item)}>
                  <span className="admin-kind-icon">
                    {item.kind === "appointment" ? (
                      <CalendarDays size={19} />
                    ) : item.kind === "audit" ? (
                      <ShieldCheck size={19} />
                    ) : (
                      <FileText size={19} />
                    )}
                  </span>
                  <span className="admin-recent-text">
                    <strong>{item.subject || item.service?.name}</strong>
                    <small>
                      {item.user?.name} · {KIND_LABEL[item.kind]} #{item.id}
                    </small>
                  </span>
                  <Status value={item.status} />
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="card">
          <div className="admin-section-title">
            <div>
              <h2>Prochains rendez-vous</h2>
              <p>Horaires de Libreville (UTC+1).</p>
            </div>
            <CalendarDays size={22} />
          </div>
          {data.upcoming.length === 0 ? (
            <div className="admin-empty">
              <CalendarDays size={32} />
              <p>Aucun rendez-vous confirmé à venir.</p>
              <button
                className="text-link"
                onClick={() => onNavigate("appointment")}
              >
                Consulter les demandes →
              </button>
            </div>
          ) : (
            <div className="admin-agenda">
              {data.upcoming.map((item) => (
                <button key={item.id} onClick={() => onOpen(item)}>
                  <strong>{dateLabel(item.preferred_at)}</strong>
                  <span>{item.subject}</span>
                  <small>
                    {item.user?.name} ·{" "}
                    {item.meeting_mode === "visio"
                      ? "Visioconférence"
                      : item.meeting_mode === "telephone"
                        ? "Téléphone"
                        : "Sur place"}
                  </small>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="admin-overview-grid">
        <section className="card">
          <div className="admin-section-title">
            <div>
              <h2>Répartition de l’activité</h2>
              <p>
                {total} demande{total > 1 ? "s" : ""} enregistrée
                {total > 1 ? "s" : ""}, tous statuts confondus.
              </p>
            </div>
          </div>
          <div className="admin-distribution">
            {Object.entries(data.totals).map(([kind, count]) => (
              <button key={kind} onClick={() => onNavigate(kind)}>
                <span>
                  {KIND_LABEL[kind]}
                  <strong>{count}</strong>
                </span>
                <progress
                  aria-label={KIND_LABEL[kind]}
                  max={Math.max(total, 1)}
                  value={count}
                />
              </button>
            ))}
          </div>
        </section>
        <section className="card">
          <div className="admin-section-title">
            <div>
              <h2>Votre vitrine</h2>
              <p>Des coordonnées complètes facilitent la prise de contact.</p>
            </div>
            <Building2 size={22} />
          </div>
          {!site ? (
            <p>Informations du site indisponibles.</p>
          ) : (
            <>
              <ul className="admin-readiness">
                {tasks.map(([label, done]) => (
                  <li key={label}>
                    <span>{label}</span>
                    <span className={done ? "ready" : "missing"}>
                      {done ? (
                        <>
                          <CheckCircle2 size={14} />
                          Renseigné
                        </>
                      ) : (
                        "À compléter"
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                className="text-link"
                onClick={() => onNavigate("company")}
              >
                Mettre à jour les informations →
              </button>
            </>
          )}
        </section>
      </div>
    </>
  );
}
export default function Admin() {
  const { logout } = useAuth();
  const { site } = useSite();
  const [tab, setTab] = useState("dashboard"),
    [page, setPage] = useState(1),
    [data, setData] = useState(null),
    [error, setError] = useState(null),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0),
    [success, setSuccess] = useState(""),
    [selected, setSelected] = useState(null),
    [editorStates, setEditorStates] = useState({});
  const dirty = Object.values(editorStates).some((state) => state.dirty);
  const saving = Object.values(editorStates).some((state) => state.busy);
  const updateEditorState = useCallback((key, state) => {
    setEditorStates((current) => {
      if (!state) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      if (
        current[key]?.dirty === state.dirty &&
        current[key]?.busy === state.busy
      )
        return current;
      return { ...current, [key]: state };
    });
  }, []);
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("newest");
  const isRequests = ["quote", "audit", "appointment"].includes(tab);
  function canLeave() {
    if (saving) return false;
    return (
      !dirty || window.confirm("Quitter sans enregistrer vos modifications ?")
    );
  }
  function navigate(next) {
    if (next === tab && !selected) return true;
    if (!canLeave()) return false;
    if (next === tab) {
      setSelected(null);
      setEditorStates({});
      return true;
    }
    setData(null);
    setLoading(next !== "company");
    setError(null);
    setTab(next);
    setPage(1);
    setSelected(null);
    setEditorStates({});
    setSearch("");
    setQuery("");
    setStatus("");
    setSort("newest");
    setSuccess("");
    return true;
  }
  function open(item) {
    if (item.kind && item.kind !== tab) {
      if (!navigate(item.kind)) return;
    } else if (!canLeave()) return;
    setSelected(item);
    setEditorStates({});
    setSuccess("");
  }
  useEffect(() => {
    if (!dirty && !saving) return;
    const before = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty, saving]);
  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    if (tab === "company" || tab === "pages" || tab === "messages") {
      setLoading(false);
      return;
    }
    setLoading(true);
    const call =
      tab === "dashboard"
        ? api.adminDashboard()
        : tab === "services"
          ? api.getServices()
          : api.adminRequests(tab, page, { search: query, status, sort });
    call
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active) setError(e);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab, page, refresh, query, status, sort]);
  function reload() {
    if (!canLeave()) return;
    setSelected(null);
    setEditorStates({});
    setRefresh((n) => n + 1);
  }
  const title = SECTIONS.find(([key]) => key === tab)?.[1];
  return (
    <div className="admin-workspace">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="eyebrow">AXORA / Administration</span>
          <strong>Votre espace de pilotage</strong>
          <p>Suivi clients et contenus du site</p>
        </div>
        <nav aria-label="Rubriques de l’administration">
          {SECTIONS.map(([key, label, Icon]) => (
            <button
              key={key}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => navigate(key)}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>
        <Link
          className="admin-site-link"
          to="/"
          onClick={(e) => {
            if (!canLeave()) e.preventDefault();
          }}
        >
          Voir le site <ArrowUpRight size={17} />
        </Link>
        <button
          className="admin-logout"
          type="button"
          onClick={() => {
            if (canLeave()) logout();
          }}
          title="Se déconnecter"
        >
          <LogOut size={17} />
          Se déconnecter
        </button>
        <div className="admin-access">
          <span />
          Accès réservé à l’équipe
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-page-header">
          <div>
            <span className="eyebrow">Gestion de l’activité</span>
            <h1>{title}</h1>
            <p>
              {tab === "dashboard"
                ? "Les informations utiles pour organiser votre journée."
                : tab === "messages"
                  ? "Échangez en privé avec vos clients et répondez en équipe."
                  : isRequests
                    ? "Retrouvez un dossier, consultez son contexte et répondez au client."
                    : "Gardez les informations publiques d’AXORA à jour."}
            </p>
          </div>
          {tab !== "company" && tab !== "pages" && tab !== "messages" && (
            <button
              className="btn secondary"
              onClick={reload}
              disabled={loading || saving}
            >
              <RefreshCw size={17} />
              Actualiser
            </button>
          )}
        </header>
        {success && (
          <p className="notice" role="status">
            {success}
          </p>
        )}
        <Errors error={error} />
        {error && (
          <button className="btn secondary" onClick={reload}>
            Réessayer
          </button>
        )}
        {tab === "messages" ? (
          <Messaging admin onState={updateEditorState} />
        ) : tab === "company" ? (
          <CompanyEditor onState={updateEditorState} />
        ) : tab === "pages" ? (
          <PageContentEditor onState={updateEditorState} />
        ) : selected && isRequests ? (
          <section className="admin-dossier">
            <div className="admin-dossier-top">
              <button
                className="text-link"
                onClick={() => {
                  if (canLeave()) {
                    setSelected(null);
                    setEditorStates({});
                  }
                }}
              >
                <ArrowLeft size={18} />
                Retour aux demandes
              </button>
              {dirty && (
                <span className="admin-draft">
                  Modifications non enregistrées
                </span>
              )}
            </div>
            <RequestEditor
              key={tab + "-" + selected.id}
              kind={tab}
              item={selected}
              onState={updateEditorState}
              onSaved={() => {
                setEditorStates({});
                setSelected(null);
                setSuccess(
                  "Réponse enregistrée et visible dans l’espace du client.",
                );
                setRefresh((n) => n + 1);
              }}
            />
          </section>
        ) : (
          <>
            {isRequests && (
              <form
                className="admin-filters"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(1);
                  setQuery(search.trim());
                }}
              >
                <label className="admin-search">
                  <span className="sr-only">
                    Rechercher par client, email, sujet ou numéro
                  </span>
                  <Search size={18} />
                  <input
                    maxLength={150}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Client, email, sujet, numéro…"
                  />
                </label>
                <button className="btn" type="submit">
                  Rechercher
                </button>
                <Field label="Statut">
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Tous les statuts</option>
                    {(tab === "appointment"
                      ? ["nouveau", "confirme", "termine", "annule"]
                      : ["nouveau", "en_cours", "traite", "annule"]
                    ).map((s) => (
                      <option key={s} value={s}>
                        {labels[s]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Ordre">
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="newest">Plus récents</option>
                    <option value="oldest">Plus anciens</option>
                  </select>
                </Field>
                {(query || status || sort !== "newest") && (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => {
                      setSearch("");
                      setQuery("");
                      setStatus("");
                      setSort("newest");
                      setPage(1);
                    }}
                  >
                    Réinitialiser
                  </button>
                )}
              </form>
            )}
            {loading ? (
              <div className="admin-loading" role="status">
                <RefreshCw size={24} />
                <p>Chargement de votre espace…</p>
              </div>
            ) : tab === "dashboard" && data ? (
              <Overview
                data={data}
                site={site}
                onNavigate={navigate}
                onOpen={open}
              />
            ) : tab === "services" ? (
              <div className="request-list">
                {data?.map((s) => (
                  <ServiceEditor
                    key={s.id}
                    service={s}
                    onState={updateEditorState}
                  />
                ))}
              </div>
            ) : isRequests && data ? (
              <>
                <div className="admin-results">
                  <strong>
                    {data.total} dossier{data.total > 1 ? "s" : ""}
                  </strong>
                  <span>
                    Page {data.current_page} sur {data.last_page}
                  </span>
                </div>
                {data.data.length === 0 ? (
                  <div className="card admin-empty">
                    <Inbox size={36} />
                    <h2>
                      {query || status
                        ? "Aucun dossier ne correspond"
                        : "Aucune demande pour le moment"}
                    </h2>
                    <p>
                      {query || status
                        ? "Essayez un autre nom ou modifiez les filtres."
                        : "Les demandes de vos clients seront centralisées ici."}
                    </p>
                  </div>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <caption className="sr-only">
                        Liste des demandes de {title}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Dossier</th>
                          <th scope="col">Client</th>
                          <th scope="col">
                            {tab === "appointment"
                              ? "Horaire demandé"
                              : "Reçu le"}
                          </th>
                          <th scope="col">Statut</th>
                          <th scope="col">
                            <span className="sr-only">Action</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.data.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <span className="admin-reference">
                                {KIND_LABEL[tab]} #{item.id}
                              </span>
                              <strong>
                                {item.subject || item.service?.name}
                              </strong>
                            </td>
                            <td>
                              <strong>{item.user?.name}</strong>
                              <small>
                                {item.user?.company_name || item.user?.email}
                              </small>
                            </td>
                            <td>
                              <span className="admin-date">
                                {dateLabel(
                                  tab === "appointment"
                                    ? item.preferred_at
                                    : item.created_at,
                                )}
                              </span>
                            </td>
                            <td>
                              <Status value={item.status} />
                            </td>
                            <td>
                              <button
                                className="text-link"
                                onClick={() => open(item)}
                                aria-label={"Ouvrir le dossier " + item.id}
                              >
                                Ouvrir <ArrowUpRight size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <Pagination data={data} onPage={setPage} />
              </>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
