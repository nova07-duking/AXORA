import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
export default function Nav() {
  const [open, setOpen] = useState(false),
    { user, logout } = useAuth(),
    location = useLocation(),
    navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  async function leave() {
    await logout();
    setOpen(false);
    navigate("/");
  }
  const links = [
    ["/services", "Services"],
    ["/audit", "Audit"],
    ["/rendez-vous", "Rendez-vous"],
    ["/a-propos", "L’entreprise"],
    ["/contact", "Contact"],
  ];
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Navigation principale">
        <Link to="/" aria-label="AXORA — Accueil">
          <Logo />
        </Link>
        <div className="desktop-links">
          {links.map(([p, l]) => (
            <NavLink key={p} to={p}>
              {l}
            </NavLink>
          ))}
        </div>
        <div className="desktop-account">
          {user ? (
            <>
              <Link className="btn small" to="/mon-espace">
                Mon espace
              </Link>
              <button className="text-link" onClick={leave}>
                Déconnexion
              </button>
            </>
          ) : (
            <Link className="btn small" to="/connexion">
              Connexion →
            </Link>
          )}
        </div>
        <button
          className="mobile-toggle"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <nav
          id="mobile-menu"
          className="mobile-menu"
          aria-label="Navigation mobile"
        >
          {links.map(([p, l]) => (
            <NavLink key={p} to={p}>
              {l}
            </NavLink>
          ))}
          <Link to={user ? "/mon-espace" : "/connexion"}>
            {user ? "Mon espace" : "Connexion"}
          </Link>
          {user && <button onClick={leave}>Déconnexion</button>}
        </nav>
      )}
    </header>
  );
}
