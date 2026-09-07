import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Field, Errors } from "../components/UI";
export default function Login() {
  const { login } = useAuth(),
    location = useLocation(),
    navigate = useNavigate(),
    from = location.state?.from || "/mon-espace";
  const [form, setForm] = useState({ email: "", password: "" }),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page reading" style={{ maxWidth: 560 }}>
      <div className="page-heading">
        <span className="eyebrow">Votre espace AXORA</span>
        <h1>Heureux de vous retrouver.</h1>
        <p>
          Connectez-vous pour gérer vos demandes et échanger avec notre équipe.
        </p>
      </div>
      <form className="card form-stack" onSubmit={submit}>
        <Field label="Adresse email">
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={255}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Mot de passe">
          <input
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Link className="text-link" to="/mot-de-passe-oublie">
          Mot de passe oublié ?
        </Link>
        <Errors error={error} />
        <button className="btn" disabled={busy}>
          {busy ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <p>
        Pas encore de compte ?{" "}
        <Link className="text-link" to="/inscription" state={{ from }}>
          Créer un compte
        </Link>
      </p>
    </section>
  );
}
