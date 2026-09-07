import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, FileText } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { NEED_TYPES } from "../data/services";
import { Field, Errors } from "../components/UI";
export default function QuoteRequest() {
  const { user } = useAuth();
  const [params] = useSearchParams(),
    [services, setServices] = useState([]),
    [form, setForm] = useState({
      service_id: "",
      need_type: "developpement",
      message: "",
      budget_estimatif: "",
    }),
    [error, setError] = useState(null),
    [loadError, setLoadError] = useState(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(null),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    api
      .getServices()
      .then((list) => {
        if (!active) return;
        setServices(list);
        const selected = list.find((s) => s.slug === params.get("service"));
        setForm((f) => ({
          ...f,
          service_id: selected?.id || list[0]?.id || "",
        }));
      })
      .catch((e) => {
        if (active) setLoadError(e);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params, retry]);
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      setSent(await api.createQuoteRequest(form));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow">
          {user.type === "entreprise" ? "Espace organisation" : "Espace client"}{" "}
          / Devis
        </span>
        <h1>Donnons forme à votre projet.</h1>
        <p>
          Présentez votre besoin pour recevoir une proposition adaptée à votre
          contexte.
        </p>
      </div>
      <div className="split-layout">
        <aside className="dark-card">
          <FileText size={36} />
          <h2>
            Un besoin bien défini,
            <br />
            une réponse plus précise.
          </h2>
          <p>
            Décrivez votre activité, les fonctionnalités souhaitées, votre
            échéance et vos contraintes.
          </p>
          <p>
            La demande est sans engagement. La proposition et les prochaines
            étapes seront disponibles dans votre espace client.
          </p>
          <Link className="btn outline-light" to="/rendez-vous">
            En parler d’abord
          </Link>
        </aside>
        {sent ? (
          <div className="card success-panel" role="status">
            <CheckCircle2 size={40} />
            <h2>Demande enregistrée</h2>
            <p>
              Référence DEV-{sent.id}. Retrouvez la réponse de l’équipe dans
              votre espace.
            </p>
            <Link className="btn" to="/mon-espace">
              Suivre ma demande
            </Link>
          </div>
        ) : (
          <form className="card form-stack" onSubmit={submit}>
            <Errors error={loadError} />
            {loadError && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => setRetry((n) => n + 1)}
              >
                Recharger les services
              </button>
            )}
            <Field label="Service concerné">
              <select
                required
                disabled={loading || !!loadError}
                value={form.service_id}
                onChange={update("service_id")}
              >
                <option value="">
                  {loading ? "Chargement…" : "Choisissez un service"}
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nature de votre besoin">
              <select value={form.need_type} onChange={update("need_type")}>
                {NEED_TYPES.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Budget estimatif (facultatif)">
              <input
                maxLength={100}
                value={form.budget_estimatif}
                onChange={update("budget_estimatif")}
                placeholder="Ex. 2 000 000 à 5 000 000 FCFA"
              />
            </Field>
            <Field label="Décrivez votre projet">
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
              Les informations transmises servent au traitement de votre
              demande.{" "}
              <Link className="text-link" to="/confidentialite">
                Confidentialité
              </Link>
            </p>
            <Errors error={error} />
            <button
              className="btn"
              disabled={busy || loading || !!loadError || !form.service_id}
            >
              {busy ? "Enregistrement…" : "Envoyer ma demande"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
