import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Target, Compass, CheckCircle2 } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { Errors } from "../components/UI";
export default function About() {
  const { site, loading, error, reload } = useSite();
  const { hash } = useLocation();
  useEffect(() => {
    if (site && hash === '#equipe') document.getElementById('equipe')?.scrollIntoView();
  }, [site, hash]);
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
  const p = site.pages?.about || {};
  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow">{p.eyebrow || "À propos d’AXORA"}</span>
        <h1>{p.title || "Une expertise numérique. Un ancrage gabonais."}</h1>
        <p>{p.lead || "Accompagner les organisations et les particuliers, du premier besoin à la solution opérationnelle."}</p>
      </div>
      <div className="story-grid">
        <div>
          <h2>{p.story_title || "Notre histoire"}</h2>
          <p className="preserve">{c.history}</p>
        </div>
        <figure>
          <img
            className="editorial-image"
            src={p.image || "/images/software-desk.jpg"}
            width="1800"
            height="1200"
            alt="Ordinateur affichant du code sur un bureau"
            loading="lazy"
          />
          <figcaption>
            Développement logiciel — photographie d’illustration.
          </figcaption>
        </figure>
      </div>
      <div className="form-grid section-space">
        <div className="card">
          <Compass />
          <h2>{p.mission_title || "Notre mission"}</h2>
          <p>{c.mission}</p>
        </div>
        <div className="dark-card">
          <Target />
          <h2>{p.vision_title || "Notre vision"}</h2>
          <p>{c.vision}</p>
        </div>
      </div>
      <div className="section-space">
        <span className="eyebrow">{p.objectives_eyebrow || "Ce qui nous guide"}</span>
        <h2>{p.objectives_title || "Nos objectifs"}</h2>
        <div className="action-grid">
          {c.objectives.map((o, i) => (
            <div className="card" key={i}>
              <CheckCircle2 className="accent" />
              <p>{o}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="section-space" id="equipe">
        <span className="eyebrow">{p.team_eyebrow || "Les personnes derrière AXORA"}</span>
        <h2>{p.team_title || "Notre équipe"}</h2>
        <div className="team-grid">
          {c.team.map((m, i) => (
            <article className="card team-card" key={i}>
              {m.photo_url ? (
                <img
                  src={m.photo_url}
                  alt={m.name}
                  className="portrait"
                  loading="lazy"
                />
              ) : (
                <div className="initial-avatar" aria-hidden="true">
                  {m.name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </div>
              )}
              <h3>{m.name}</h3>
              <p className="accent">{m.role}</p>
              {m.bio && <p>{m.bio}</p>}
            </article>
          ))}
        </div>
      </div>
      <div className="banner">
        <div>
          <h2>{p.banner_title || "Construisons la suite ensemble."}</h2>
          <p>{p.banner_text || "Parlons de vos priorités et de votre prochain projet."}</p>
        </div>
        <Link className="btn light" to="/rendez-vous">
          Rencontrer l’équipe →
        </Link>
      </div>
    </section>
  );
}
