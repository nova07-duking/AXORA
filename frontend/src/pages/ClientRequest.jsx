import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ShieldCheck, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Field, Errors } from "../components/UI";
export default function ClientRequest({ kind }) {
  const { user } = useAuth();
  const appointment = kind === "appointment";
  const [form, setForm] = useState({
    subject: "",
    message: "",
    audit_type: "cybersecurite",
    organization_size: "1-10",
    preferred_at: "",
    meeting_mode: "visio",
  });
  const [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(null);
  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body = { ...form, kind };
      if (appointment) body.preferred_at = form.preferred_at + "+01:00";
      setSent(await api.createRequest(body));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  const Icon = appointment ? CalendarDays : ShieldCheck;
  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow">
          {user.type === "entreprise" ? "Espace organisation" : "Espace client"}{" "}
          / {appointment ? "Rendez-vous" : "Audit"}
        </span>
        <h1>
          {appointment
            ? "Prenons le temps de parler de votre projet."
            : "Identifiez vos risques. Priorisez vos actions."}
        </h1>
        <p>
          {appointment
            ? "Proposez un horaire pour un premier échange. Notre équipe confirmera votre rendez-vous dans votre espace client."
            : "Décrivez votre environnement pour préparer un audit adapté à vos enjeux."}
        </p>
      </div>
      <div className="split-layout">
        <aside className="dark-card">
          <Icon size={36} />
          <h2>{appointment ? "Un échange ciblé" : "Un diagnostic utile"}</h2>
          <p>
            {appointment
              ? "En visioconférence, par téléphone ou sur place après confirmation du lieu."
              : "Sécurité, infrastructure, données ou applications : choisissez le périmètre à étudier."}
          </p>
          <ol className="steps-list">
            <li>Vous décrivez votre besoin.</li>
            <li>Nous précisons ensemble le périmètre.</li>
            <li>
              {appointment
                ? "L’équipe confirme les modalités."
                : "Vous recevez une proposition dans votre espace client."}
            </li>
          </ol>
          <p className="muted-light">
            Les horaires sont indiqués à l’heure de Libreville (UTC+1).
          </p>
        </aside>
        {sent ? (
          <div className="card success-panel" role="status">
            <CheckCircle2 size={40} />
            <h2>Demande reçue</h2>
            <p>
              Votre référence : {appointment ? "RDV" : "AUD"}-{sent.id}.
            </p>
            <p>
              {appointment
                ? "Le rendez-vous sera confirmé par l’équipe. Consultez votre espace pour connaître sa réponse."
                : "Votre demande d’audit est enregistrée. L’équipe vous répondra dans votre espace client."}
            </p>
            <Link className="btn" to="/mon-espace">
              Suivre ma demande
            </Link>
          </div>
        ) : (
          <form className="card form-stack" onSubmit={submit}>
            <Field label="Sujet">
              <input
                required
                maxLength={255}
                value={form.subject}
                onChange={update("subject")}
                placeholder={
                  appointment
                    ? "Ex. Création de notre application métier"
                    : "Ex. Évaluer la sécurité de notre réseau"
                }
              />
            </Field>
            {appointment ? (
              <>
                <Field
                  label="Date et heure souhaitées — Libreville (UTC+1)"
                  hint="Horaire proposé, sous réserve de confirmation."
                >
                  <input
                    required
                    type="datetime-local"
                    value={form.preferred_at}
                    onChange={update("preferred_at")}
                  />
                </Field>
                <Field label="Format de l’échange">
                  <select
                    value={form.meeting_mode}
                    onChange={update("meeting_mode")}
                  >
                    <option value="visio">Visioconférence</option>
                    <option value="telephone">Téléphone</option>
                    <option value="sur_place">Sur place</option>
                  </select>
                </Field>
              </>
            ) : (
              <div className="form-grid">
                <Field label="Périmètre de l’audit">
                  <select
                    value={form.audit_type}
                    onChange={update("audit_type")}
                  >
                    <option value="cybersecurite">Cybersécurité</option>
                    <option value="infrastructure">
                      Infrastructure et réseau
                    </option>
                    <option value="data">Données et gouvernance</option>
                    <option value="application">
                      Application web ou mobile
                    </option>
                    <option value="global">Diagnostic global</option>
                  </select>
                </Field>
                <Field label="Taille de votre organisation">
                  <select
                    value={form.organization_size}
                    onChange={update("organization_size")}
                  >
                    {["1-10", "11-50", "51-200", "200+"].map((n) => (
                      <option key={n} value={n}>
                        {n} personnes
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
            <Field
              label="Votre besoin"
              hint="Précisez le contexte et vos coordonnées téléphoniques si nécessaire. Ne transmettez aucun mot de passe."
            >
              <textarea
                required
                minLength={10}
                maxLength={10000}
                rows={6}
                value={form.message}
                onChange={update("message")}
              />
            </Field>
            <p className="help">
              Ces informations servent au traitement de votre demande.{" "}
              <Link to="/confidentialite">Utilisation des données</Link>
            </p>
            <Errors error={error} />
            <button className="btn" disabled={busy}>
              {busy
                ? "Enregistrement…"
                : appointment
                  ? "Demander ce rendez-vous"
                  : "Envoyer ma demande d’audit"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
