import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Shield,
  Database,
  Code2,
  Sparkles,
  Wifi,
} from "lucide-react";
import { useSite } from "../context/SiteContext";
const services = [
  [
    "cybersecurite",
    Shield,
    "Cybersécurité",
    "Identifiez les risques et protégez vos systèmes.",
  ],
  ["data", Database, "Data", "Transformez vos données en décisions utiles."],
  ["dev", Code2, "Web & mobile", "Créez les outils adaptés à votre activité."],
  [
    "ia",
    Sparkles,
    "Intelligence artificielle",
    "Automatisez et simplifiez votre quotidien.",
  ],
  ["iot", Wifi, "Objets connectés", "Reliez vos équipements à vos décisions."],
];
export default function Home() {
  const { site } = useSite();
  const p = site?.pages?.home || {};
  const methodSteps = p.method_steps || [
    ["01", "Comprendre", "Échanger sur vos usages, vos contraintes et vos priorités."],
    ["02", "Définir", "Cadrer le périmètre, les livrables et les étapes de votre projet."],
    ["03", "Construire", "Mettre en œuvre la solution et partager les avancées."],
    ["04", "Accompagner", "Transmettre les compétences et faire évoluer vos outils."],
  ];
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div>
            <span className="eyebrow">{p.hero_eyebrow || "Libreville, Gabon · Solutions numériques"}</span>
            <h1>
              {(p.hero_title || "Le numérique au service de").split(" ").map((word, i) => (
                <React.Fragment key={word + i}>
                  {i > 0 && " "}
                  {word}
                  {i === 1 && <br />}
                </React.Fragment>
              ))}
              <br />
              <em>{p.hero_emphasis || "vos ambitions."}</em>
            </h1>
            <p>
              {p.hero_lead || "De la sécurité de vos systèmes à la création de vos outils : AXORA accompagne vos projets avec une approche concrète et des expertises complémentaires."}
            </p>
            <div className="button-row">
              <Link className="btn" to="/rendez-vous">
                Parlons de votre projet <ArrowRight size={18} />
              </Link>
              <Link className="btn secondary" to="/services">
                Explorer nos services
              </Link>
            </div>
            <div className="hero-note">
              <span /> {p.hero_note || "Particuliers · Entreprises · Administrations"}
            </div>
          </div>
          <figure className="hero-photo">
            <img
              src={p.hero_image || "/images/infrastructure.jpg"}
              width="1800"
              height="1200"
              alt="Racks de serveurs dans un centre de données"
              fetchPriority="high"
            />
            <figcaption>
              <span>PROTÉGER. CONSTRUIRE. CONNECTER.</span>
              <strong>
                Votre prochain chapitre
                <br />
                commence ici.
              </strong>
              <small>Infrastructure numérique · Photo d’illustration</small>
            </figcaption>
          </figure>
        </div>
      </section>
      <section className="page home-services">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Notre savoir-faire</span>
            <h2>Des expertises qui se complètent.</h2>
          </div>
          <Link className="text-link" to="/services">
            Tous nos services <ArrowRight size={18} />
          </Link>
        </div>
        <div className="expertise-grid">
          {services.map(([slug, Icon, title, text], i) => (
            <Link
              className="expertise"
              to={"/services?service=" + slug}
              key={slug}
            >
              <div className="card-top">
                <Icon />
                <span>0{i + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <ArrowRight size={20} />
            </Link>
          ))}
        </div>
      </section>
      <section className="method-section">
        <div className="page">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{p.method_eyebrow || "De l’idée à l’action"}</span>
              <h2>{p.method_title || "Un cap clair à chaque étape."}</h2>
            </div>
            <p>{p.method_intro || "Comprendre votre contexte pour construire une réponse qui vous ressemble."}</p>
          </div>
          <div className="method-grid">
            {methodSteps.map((step) => {
              const [n, t, text] = Array.isArray(step)
                ? step
                : [step.number, step.title, step.text];
              return (
              <div key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{text}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="page">
        <div className="story-grid">
          <figure>
            <img
              src={p.story_image || "/images/software-desk.jpg"}
              className="editorial-image"
              width="1800"
              height="1200"
              alt="Poste de travail consacré au développement logiciel"
              loading="lazy"
            />
            <figcaption>
              Développement logiciel · Photo d’illustration
            </figcaption>
          </figure>
          <div>
            <span className="eyebrow">{p.story_eyebrow || "Ancrage local, ambition partagée"}</span>
            <h2>{p.story_title || "Une relation de travail. Pas seulement une prestation."}</h2>
            <p>{p.story_text || "Basée à Libreville, AXORA réunit la cybersécurité, la data, le développement, l’IA et l’IoT pour accompagner vos besoins numériques."}</p>
            <Link className="text-link" to="/a-propos">
              Découvrir AXORA et l’équipe <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="banner">
          <div>
            <span className="eyebrow">{p.cta_eyebrow || "Faisons le premier pas"}</span>
            <h2>{p.cta_title || "Quel est votre prochain défi ?"}</h2>
            <p>{p.cta_text || "Un diagnostic, une application ou un système à faire évoluer."}</p>
          </div>
          <div className="button-row">
            <Link className="btn light" to="/audit">
              Demander un audit
            </Link>
            <Link className="btn outline-light" to="/devis">
              Obtenir un devis
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
