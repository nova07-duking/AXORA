import React, { useCallback, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageCircle,
  FileText,
  ShieldCheck,
  CalendarDays,
  ArrowUpRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  ["/mon-espace", "Mes demandes", LayoutDashboard],
  ["/mon-espace/messages", "Ma messagerie", MessageCircle],
  ["/devis", "Demander un devis", FileText],
  ["/audit", "Demander un audit", ShieldCheck],
  ["/rendez-vous", "Prendre rendez-vous", CalendarDays],
];

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const isOrganization = user.type === "entreprise";
  const navigate = useNavigate();
  const editor = useRef({});
  const [leaving, setLeaving] = useState(false);
  const onState = useCallback((key, state) => {
    editor.current = state || {};
  }, []);
  function canLeave() {
    return (
      !leaving &&
      !editor.current.busy &&
      (!editor.current.dirty ||
        window.confirm("Abandonner le message non envoyé ?"))
    );
  }
  function guard(event) {
    if (!canLeave()) event.preventDefault();
  }
  async function leave() {
    if (!canLeave()) return;
    setLeaving(true);
    await logout();
    navigate("/", { replace: true });
  }
  return (
    <div className="admin-workspace client-workspace">
      <aside className="admin-sidebar client-sidebar">
        <div className="admin-brand">
          <span className="eyebrow">
            AXORA / {isOrganization ? "Espace organisation" : "Espace client"}
          </span>
          <strong>
            {isOrganization
              ? user.company_name || "Votre organisation"
              : "Votre espace personnel"}
          </strong>
          <p>
            {isOrganization ? `Contact référent : ${user.name}` : user.name}
          </p>
        </div>
        <nav aria-label="Navigation de l’espace client">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end onClick={guard}>
              <Icon size={19} />
              {isOrganization && to === "/mon-espace"
                ? "Demandes de l’organisation"
                : isOrganization && to === "/mon-espace/messages"
                  ? "Messagerie AXORA"
                  : label}
            </NavLink>
          ))}
          {user.is_admin && (
            <NavLink to="/administration" onClick={guard}>
              <ShieldCheck size={19} />
              Administration
            </NavLink>
          )}
        </nav>
        <NavLink className="admin-site-link" to="/" onClick={guard}>
          Voir le site <ArrowUpRight size={17} />
        </NavLink>
        <button className="admin-logout" onClick={leave} disabled={leaving}>
          <LogOut size={17} />
          {leaving ? "Déconnexion…" : "Se déconnecter"}
        </button>
        <div className="admin-access">
          <span />
          Votre compte · Vos échanges privés
        </div>
      </aside>
      <div className="admin-main client-main">
        <Outlet context={{ onState }} />
      </div>
    </div>
  );
}
