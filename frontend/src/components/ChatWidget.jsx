import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send } from "lucide-react";
import { api } from "../api/client";
import { useSite } from "../context/SiteContext";
export default function ChatWidget() {
  const { site } = useSite();
  const [open, setOpen] = useState(false),
    [consent, setConsent] = useState(false),
    [messages, setMessages] = useState([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const end = useRef(null),
    field = useRef(null),
    trigger = useRef(null);
  useEffect(() => {
    if (open) field.current?.focus();
  }, [open, consent]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  async function send(e) {
    e.preventDefault();
    if (!input.trim() || busy || !consent) return;
    const next = [...messages, { role: "user", content: input.trim() }].slice(
      -11,
    );
    setBusy(true);
    setError("");
    try {
      const d = await api.chat(next);
      setMessages([...next, { role: "assistant", content: d.reply }]);
      setInput("");
    } catch (e) {
      setError(e.message || "Impossible de joindre l’assistant.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="chat-widget">
      {open && (
        <section
          className="chat-panel"
          role="dialog"
          aria-label="Assistant AXORA"
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        >
          <header>
            <div>
              <strong>AXORA · Assistant</strong>
              <small>
                {site?.chat_enabled
                  ? "Renseignements avec l’IA"
                  : "Comment pouvons-nous vous aider ?"}
              </small>
            </div>
            <button aria-label="Fermer le chat" onClick={close}>
              <X />
            </button>
          </header>
          <div className="chat-body">
            <p>
              Bonjour ! Retrouvez le bon service et préparez votre échange avec
              AXORA.
            </p>
            <div className="chat-shortcuts">
              <Link to="/services" onClick={close}>
                Services
              </Link>
              <Link to="/audit" onClick={close}>
                Audit
              </Link>
              <Link to="/rendez-vous" onClick={close}>
                Rendez-vous
              </Link>
            </div>
            {!site?.chat_enabled ? (
              <p>
                L’assistant IA est momentanément indisponible.{" "}
                <Link className="text-link" to="/contact" onClick={close}>
                  Contacter notre équipe
                </Link>
                .
              </p>
            ) : (
              <>
                {!consent ? (
                  <div className="notice">
                    <p>
                      En utilisant le chat, vos messages sont transmis à OpenAI
                      pour générer une réponse. N’envoyez pas de données
                      confidentielles.
                    </p>
                    <button className="btn" onClick={() => setConsent(true)}>
                      Accepter et démarrer le chat
                    </button>
                    <Link
                      className="text-link"
                      to="/confidentialite"
                      onClick={close}
                    >
                      En savoir plus
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="help">
                      Réponses générées par IA, à vérifier avec l’équipe. Aucune
                      réservation ne se fait dans le chat.
                    </p>
                    {messages.map((m, i) => (
                      <div key={i} className={"bubble " + m.role}>
                        <strong>
                          {m.role === "user" ? "Vous" : "Assistant IA"}
                        </strong>
                        <p>{m.content}</p>
                      </div>
                    ))}
                    {busy && (
                      <p role="status">L’assistant prépare sa réponse…</p>
                    )}
                    <div ref={end} />
                  </>
                )}
              </>
            )}
          </div>
          {site?.chat_enabled && consent && (
            <form onSubmit={send} className="chat-form">
              {error && (
                <p className="error-text" role="alert">
                  {error}
                </p>
              )}
              <div>
                <input
                  ref={field}
                  aria-label="Votre message"
                  maxLength={2000}
                  required
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Votre question sur AXORA…"
                />
                <button
                  className="btn"
                  aria-label="Envoyer"
                  disabled={busy || !input.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
              <button
                type="button"
                className="text-link"
                disabled={busy}
                onClick={() => {
                  setMessages([]);
                  setConsent(false);
                  setError("");
                  setInput("");
                }}
              >
                Effacer la conversation
              </button>
            </form>
          )}
        </section>
      )}
      <button
        ref={trigger}
        className="chat-trigger"
        aria-label={open ? "Fermer l’assistant" : "Ouvrir l’assistant AXORA"}
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? <X /> : <MessageCircle />}
        <span>Parlons de votre projet</span>
      </button>
    </div>
  );
}
