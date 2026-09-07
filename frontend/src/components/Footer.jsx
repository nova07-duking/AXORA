import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useSite } from "../context/SiteContext";
export default function Footer() {
  const { site } = useSite(),
    c = site?.company,
    p = site?.pages?.footer;
  return (
    <footer className="site-footer">
      <div className="page footer-grid">
        <div>
          <Logo />
          <p>
            {p?.tagline || "Protéger. Construire. Connecter."}
            <br />
            {p?.description || "Votre partenaire numérique à Libreville."}
          </p>
        </div>
        <div>
          <h2>Découvrir</h2>
          <Link to="/services">Nos services</Link>
          <Link to="/a-propos">Notre histoire</Link>
          <Link to="/a-propos#equipe">Notre équipe</Link>
          <Link to="/contact">Contact & localisation</Link>
        </div>
        <div>
          <h2>Votre projet</h2>
          <Link to="/audit">Demander un audit</Link>
          <Link to="/rendez-vous">Prendre rendez-vous</Link>
          <Link to="/devis">Demander un devis</Link>
          <Link to="/mon-espace">Mon espace client</Link>
        </div>
        <div>
          <h2>Échangeons</h2>
          <p>{c?.city || "Libreville, Gabon"}</p>
          {c?.email && <a href={"mailto:" + c.email}>{c.email}</a>}
          {c?.phone && (
            <a href={"tel:" + c.phone.replace(/[^+0-9]/g, "")}>{c.phone}</a>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} AXORA</span>
        <Link to="/confidentialite">Confidentialité</Link>
      </div>
    </footer>
  );
}
