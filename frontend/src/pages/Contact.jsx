import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { Errors } from "../components/UI";
export default function Contact() {
  const { site, loading, error, reload } = useSite();
  if (!site)
    return (
      <section className="page">
        {loading ? (
          <p>Chargement…</p>
        ) : (
          <>
            <Errors error={error} />
            <button className="btn" onClick={reload}>
              Réessayer
            </button>
          </>
        )}
      </section>
    );
  const c = site.company;
  const p = site.pages?.contact || {};
  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow">{p.eyebrow || "Contact & localisation"}</span>
        <h1>{p.title || "Votre projet commence par une conversation."}</h1>
        <p>{p.lead || "Une question, un besoin précis ou une idée à explorer ? Contactez notre équipe."}</p>
      </div>
      <div className="split-layout">
        <div className="form-stack">
          <div className="card contact-card">
            <Mail />
            <div>
              <h2>Écrivez-nous</h2>
              <a href={"mailto:" + c.email}>{c.email}</a>
            </div>
          </div>
          {c.phone && (
            <div className="card contact-card">
              <Phone />
              <div>
                <h2>Appelez-nous</h2>
                <a href={"tel:" + c.phone.replace(/[^+0-9]/g, "")}>{c.phone}</a>
              </div>
            </div>
          )}
          {c.hours && (
            <div className="card contact-card">
              <Clock />
              <div>
                <h2>Horaires</h2>
                <p>{c.hours}</p>
              </div>
            </div>
          )}
          <Link className="btn" to="/rendez-vous">
            Demander un rendez-vous →
          </Link>
        </div>
        <div className="dark-card location-card">
          <MapPin size={38} />
          <span className="eyebrow">Nous retrouver</span>
          <h2>{c.city}</h2>
          {c.address ? (
            <p className="preserve">{c.address}</p>
          ) : (
            <p>
              Contactez-nous avant de vous déplacer pour obtenir le lieu précis
              du rendez-vous.
            </p>
          )}
          {c.maps_url && (
            <a
              className="btn light"
              href={c.maps_url}
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir l’itinéraire Google Maps ↗
            </a>
          )}
          <p className="muted-light">
            Les rencontres sur place se font après confirmation par l’équipe.
          </p>
        </div>
      </div>
      <div className="section-space">
        <h2>{p.needs_title || "De quoi avez-vous besoin ?"}</h2>
        <div className="form-grid">
          <Link className="card action-card" to="/audit">
            <h3>Évaluer votre système</h3>
            <p>Demandez un audit et précisez le périmètre à étudier.</p>
            <span className="text-link">Demander un audit →</span>
          </Link>
          <Link className="card action-card" to="/devis">
            <h3>Chiffrer un projet</h3>
            <p>Décrivez vos besoins, votre budget et votre échéance.</p>
            <span className="text-link">Demander un devis →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
