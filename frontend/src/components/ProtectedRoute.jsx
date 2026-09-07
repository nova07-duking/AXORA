import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Empêche l'accès à une page (ex : demande de devis) tant que l'utilisateur
 * n'est pas connecté. Redirige vers /connexion en conservant la page visée
 * pour y revenir juste après le login.
 */
export default function ProtectedRoute({ children, admin = false }) {
  const { user, loading, authError, refresh } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-400 text-sm">
        Chargement…
      </div>
    );
  }

  if (authError)
    return (
      <div className="page">
        <p role="alert">{authError}</p>
        <button className="btn" onClick={refresh}>
          Réessayer
        </button>
      </div>
    );
  if (!user) {
    return (
      <Navigate
        to="/connexion"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }
  if (admin && !user.is_admin)
    return (
      <div className="page">
        <h1>Accès réservé</h1>
        <p>Cet espace est réservé à l’équipe AXORA.</p>
      </div>
    );

  return children;
}
