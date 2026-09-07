import React from "react";
export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Errors({ error }) {
  if (!error) return null;
  const items = error.errors
    ? Object.values(error.errors).flat()
    : [error.message || String(error)];
  return (
    <div className="notice error" role="alert">
      {items.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  );
}
export function Pagination({ data, onPage }) {
  if (!data || data.last_page <= 1) return null;
  return (
    <nav aria-label="Pagination" className="pagination">
      <button
        className="btn secondary"
        disabled={data.current_page <= 1}
        onClick={() => onPage(data.current_page - 1)}
      >
        Précédent
      </button>
      <span>
        {data.current_page} / {data.last_page}
      </span>
      <button
        className="btn secondary"
        disabled={data.current_page >= data.last_page}
        onClick={() => onPage(data.current_page + 1)}
      >
        Suivant
      </button>
    </nav>
  );
}
export const labels = {
  nouveau: "Reçu",
  en_cours: "En cours",
  traite: "Traité",
  annule: "Annulé",
  confirme: "Confirmé",
  termine: "Terminé",
};
export function Status({ value }) {
  return (
    <span className={`status status-${value}`}>{labels[value] || value}</span>
  );
}
export function dateLabel(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Libreville",
  }).format(new Date(value));
}
