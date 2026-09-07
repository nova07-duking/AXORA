import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { api } from "../api/client";
import { SERVICE_UI } from "../data/services";
import { Errors } from "../components/UI";
const fallbackDetails = {
  cybersecurite: [
    "Évaluation des risques et des vulnérabilités",
    "Tests de sécurité sur périmètre autorisé",
    "Plan de remédiation et accompagnement",
  ],
  data: [
    "Organisation et fiabilisation des données",
    "Pipelines de données et tableaux de bord",
    "Gouvernance et aide à la décision",
  ],
  dev: [
    "Sites web et applications métier",
    "Applications mobiles et intégrations API",
    "Maintenance et évolutions fonctionnelles",
  ],
  ia: [
    "Assistants conversationnels adaptés à votre activité",
    "Automatisation des tâches documentaires",
    "Intégration et évaluation de modèles IA",
  ],
  iot: [
    "Capteurs et remontée de données terrain",
    "Plateformes de supervision",
    "Alertes et suivi des équipements",
  ],
};
export default function Services() {
  const [services, setServices] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null),
    [retry, setRetry] = useState(0);
  const [params] = useSearchParams();
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getServices()
      .then((d) => {
        if (active) setServices(d);
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
  }, [retry]);
  useEffect(() => {
    if (!loading && params.get("service"))
      document
        .getElementById(params.get("service"))
        ?.scrollIntoView({ block: "start" });
  }, [loading, params]);
  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow">Nos expertises</span>
        <h1>
          Cinq expertises.
          <br />
          Une réponse à vos enjeux.
        </h1>
        <p>
          Protéger vos systèmes, exploiter vos données et construire les outils
          qui font avancer votre activité.
        </p>
      </div>
      <Errors error={error} />
      {error && (
        <button className="btn" onClick={() => setRetry((n) => n + 1)}>
          Réessayer
        </button>
      )}
      {loading && <p>Chargement des services…</p>}
      <div className="service-list">
        {services.map((s, i) => {
          const Icon = SERVICE_UI[s.slug]?.icon;
          return (
            <article className="service-detail" id={s.slug} key={s.id}>
              <div className="service-number">0{i + 1}</div>
              <div>
                <div className="service-title">
                  {Icon && <Icon size={28} />}
                  <h2>{s.name}</h2>
                </div>
                <h3>{s.tagline}</h3>
                <p>{s.description}</p>
                <ul className="deliverables">
                  {(s.deliverables || fallbackDetails[s.slug] || []).map((d) => (
                    <li key={d}>
                      <Check size={18} />
                      {d}
                    </li>
                  ))}
                </ul>
                <Link className="text-link" to={"/devis?service=" + s.slug}>
                  Parlons de votre besoin <ArrowRight size={17} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {!loading && !error && services.length === 0 && (
        <p className="notice">
          Le catalogue est momentanément indisponible. Contactez l’équipe pour
          préciser votre besoin.
        </p>
      )}
      <div className="banner">
        <div>
          <h2>Vous ne savez pas par où commencer ?</h2>
          <p>
            Un audit permet de poser un diagnostic et de prioriser les actions.
          </p>
        </div>
        <Link className="btn light" to="/audit">
          Demander un audit →
        </Link>
      </div>
    </section>
  );
}
