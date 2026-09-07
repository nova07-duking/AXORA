import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Field, Errors } from "../components/UI";
export default function Register() {
  const { register } = useAuth(),
    location = useLocation(),
    navigate = useNavigate(),
    from = location.state?.from || "/mon-espace";
  const [form, setForm] = useState({
      type: "particulier",
      name: "",
      company_name: "",
      rccm: "",
      phone: "",
      email: "",
      password: "",
      password_confirmation: "",
    }),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  const change = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({
        ...form,
        company_name: form.type === "entreprise" ? form.company_name : null,
        rccm: form.type === "entreprise" ? form.rccm : null,
      });
      navigate(from, { replace: true });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page reading" style={{ maxWidth: 680 }}>
      <div className="page-heading">
        <span className="eyebrow">Bienvenue chez AXORA</span>
        <h1>Un espace pour vos projets.</h1>
        <p>
          Créez votre compte pour demander un devis, un audit ou un rendez-vous.
        </p>
      </div>
      <form className="card form-stack" onSubmit={submit}>
        <Field label="Vous êtes">
          <select value={form.type} onChange={change("type")}>
            <option value="particulier">Un particulier</option>
            <option value="entreprise">Une entreprise ou organisation</option>
          </select>
        </Field>
        <Field
          label={
            form.type === "entreprise"
              ? "Nom du contact référent"
              : "Nom complet"
          }
        >
          <input
            required
            autoComplete="name"
            maxLength={255}
            value={form.name}
            onChange={change("name")}
          />
        </Field>
        {form.type === "entreprise" && (
          <>
            <Field label="Raison sociale">
              <input
                required
                maxLength={255}
                autoComplete="organization"
                value={form.company_name}
                onChange={change("company_name")}
              />
            </Field>
            <Field label="Numéro RCCM (facultatif)">
              <input
                maxLength={100}
                value={form.rccm}
                onChange={change("rccm")}
              />
            </Field>
          </>
        )}
        <div className="form-grid">
          <Field label="Adresse email">
            <input
              type="email"
              required
              autoComplete="email"
              maxLength={255}
              value={form.email}
              onChange={change("email")}
            />
          </Field>
          <Field label="Téléphone (facultatif)">
            <input
              type="tel"
              autoComplete="tel"
              maxLength={30}
              value={form.phone}
              onChange={change("phone")}
            />
          </Field>
        </div>
        <Field label="Mot de passe" hint="Au moins 8 caractères.">
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={form.password}
            onChange={change("password")}
          />
        </Field>
        <Field label="Confirmer le mot de passe">
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={form.password_confirmation}
            onChange={change("password_confirmation")}
          />
        </Field>
        <p className="help">
          Vos informations servent à gérer votre compte et vos demandes.{" "}
          <Link className="text-link" to="/confidentialite">
            Utilisation des données
          </Link>
        </p>
        <Errors error={error} />
        <button className="btn" disabled={busy}>
          {busy ? "Création…" : "Créer mon compte"}
        </button>
      </form>
      <p>
        Déjà un compte ?{" "}
        <Link className="text-link" to="/connexion" state={{ from }}>
          Se connecter
        </Link>
      </p>
    </section>
  );
}
