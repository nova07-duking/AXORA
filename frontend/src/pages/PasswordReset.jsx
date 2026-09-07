import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { Field, Errors } from "../components/UI";
export default function PasswordReset() {
  const [params] = useSearchParams(),
    token = params.get("token"),
    [email, setEmail] = useState(params.get("email") || ""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const d = token
        ? await api.resetPassword({
            email,
            token,
            password,
            password_confirmation: confirmation,
          })
        : await api.forgotPassword({ email });
      setMessage(d.message);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page reading" style={{ maxWidth: 560 }}>
      <div className="page-heading">
        <span className="eyebrow">Votre compte</span>
        <h1>
          {token ? "Choisir un nouveau mot de passe" : "Mot de passe oublié ?"}
        </h1>
      </div>
      {message ? (
        <div className="notice" role="status">
          <p>{message}</p>
          <Link className="text-link" to="/connexion">
            Revenir à la connexion →
          </Link>
        </div>
      ) : (
        <form className="card form-stack" onSubmit={submit}>
          <Field label="Adresse email">
            <input
              required
              type="email"
              autoComplete="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {token && (
            <>
              <Field label="Nouveau mot de passe">
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field label="Confirmer le mot de passe">
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </Field>
            </>
          )}
          <Errors error={error} />
          <button className="btn" disabled={busy}>
            {busy
              ? "Traitement…"
              : token
                ? "Modifier mon mot de passe"
                : "Recevoir un lien par email"}
          </button>
        </form>
      )}
    </section>
  );
}
