import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, CalendarDays, ShieldCheck } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Errors, Pagination, Status, dateLabel } from "../components/UI";
export default function MySpace() {
  const { user } = useAuth();
  const isOrganization = user.type === "entreprise";
  const [tab, setTab] = useState("requests"),
    [page, setPage] = useState(1),
    [data, setData] = useState(null),
    [error, setError] = useState(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(null),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setData(null);
    (tab === "quotes" ? api.getMyQuoteRequests(page) : api.getRequests(page))
      .then((d) => {
        if (active) setData(d);
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
  }, [tab, page, refresh]);
  async function cancel(id) {
    if (!window.confirm("Annuler cette demande ?")) return;
    setBusy(id);
    setError(null);
    try {
      await api.cancelRequest(id);
      setRefresh((n) => n + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow">
          {isOrganization ? "Espace organisation" : "Espace client"}
        </span>
        <h1>
          {isOrganization
            ? user.company_name || "Votre organisation"
            : `Bonjour ${user.name.split(" ")[0]}.`}
        </h1>
        <p>
          {isOrganization
            ? "Retrouvez les demandes de votre organisation déposées avec ce compte, vos rendez-vous et les réponses de l’équipe AXORA."
            : "Vos projets, vos rendez-vous et les réponses de l’équipe, au même endroit."}
        </p>
        {user.is_admin && (
          <Link className="text-link" to="/administration">
            Accéder à la gestion AXORA →
          </Link>
        )}
      </div>
      <div className="card message-invitation">
        <div>
          <h2>Parlons de votre projet</h2>
          <p>
            Écrivez directement aux administrateurs AXORA et retrouvez leurs
            réponses dans votre messagerie privée.
          </p>
        </div>
        <Link className="btn" to="/mon-espace/messages">
          Ouvrir ma messagerie →
        </Link>
      </div>
      <div className="action-grid">
        {[
          ["/devis", FileText, "Demander un devis", "Chiffrer votre projet"],
          [
            "/audit",
            ShieldCheck,
            "Demander un audit",
            "Évaluer votre environnement",
          ],
          [
            "/rendez-vous",
            CalendarDays,
            "Prendre rendez-vous",
            "Échanger avec l’équipe",
          ],
        ].map(([to, Icon, title, text]) => (
          <Link className="card action-card" key={to} to={to}>
            <Icon />
            <h2>{title}</h2>
            <p>{text}</p>
          </Link>
        ))}
      </div>
      <div className="tabs" aria-label="Type de demande">
        {[
          ["requests", "Audits et rendez-vous"],
          ["quotes", "Devis"],
        ].map(([v, l]) => (
          <button
            key={v}
            aria-pressed={tab === v}
            onClick={() => {
              setTab(v);
              setPage(1);
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <Errors error={error} />
      {error && (
        <button
          className="btn secondary"
          onClick={() => setRefresh((n) => n + 1)}
        >
          Réessayer
        </button>
      )}
      {loading && <p role="status">Chargement de vos demandes…</p>}
      {!loading && data?.data.length === 0 && (
        <div className="card empty">
          <FileText />
          <h2>Aucune demande pour le moment</h2>
          <p>Choisissez une action ci-dessus pour commencer.</p>
        </div>
      )}
      <div className="request-list">
        {data?.data.map((q) => (
          <article className="card" key={q.id}>
            <div className="card-top">
              <div>
                <span className="eyebrow">
                  {tab === "quotes"
                    ? "DEV"
                    : q.kind === "audit"
                      ? "AUD"
                      : "RDV"}
                  -{q.id}
                </span>
                <h2>{q.subject || q.service?.name}</h2>
              </div>
              <Status value={q.status} />
            </div>
            <p className="preserve">{q.message}</p>
            {q.preferred_at && (
              <p className="schedule">
                <CalendarDays size={18} /> {dateLabel(q.preferred_at)}{" "}
                (Libreville) ·{" "}
                {q.meeting_mode === "visio"
                  ? "Visioconférence"
                  : q.meeting_mode === "telephone"
                    ? "Téléphone"
                    : "Sur place"}
              </p>
            )}
            {q.reply && (
              <div className="reply">
                <strong>Réponse de l’équipe</strong>
                <p className="preserve">{q.reply}</p>
              </div>
            )}
            {q.meeting_url && q.status === "confirme" && (
              <a
                className="btn secondary"
                href={q.meeting_url}
                target="_blank"
                rel="noreferrer"
              >
                Rejoindre le rendez-vous
              </a>
            )}
            <div className="card-bottom">
              <small>Envoyé le {dateLabel(q.created_at)}</small>
              {tab !== "quotes" &&
                ["nouveau", "confirme", "en_cours"].includes(q.status) && (
                  <button
                    className="text-link danger"
                    disabled={busy === q.id}
                    onClick={() => cancel(q.id)}
                  >
                    {busy === q.id ? "Annulation…" : "Annuler la demande"}
                  </button>
                )}
            </div>
          </article>
        ))}
      </div>
      <Pagination data={data} onPage={setPage} />
    </section>
  );
}
