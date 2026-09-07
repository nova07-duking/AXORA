import React, { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Errors, Pagination, dateLabel } from "./UI";

export function mergeMessages(previous, incoming) {
  return [
    ...new Map(
      [...previous, ...incoming].map((message) => [message.id, message]),
    ).values(),
  ].sort((a, b) => a.id - b.id);
}

function deliveryNonce() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }
  const randomHex = (length) => {
    let value = "";
    while (value.length < length) value += Math.random().toString(16).slice(2);
    return value.slice(0, length);
  };
  return `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${randomHex(3)}-${randomHex(12)}`;
}

function Thread({ conversation, admin, onCreated, onState }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]),
    [draft, setDraft] = useState("");
  const [error, setError] = useState(null),
    [syncError, setSyncError] = useState(null);
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(!!conversation);
  const [older, setOlder] = useState(false),
    [olderBusy, setOlderBusy] = useState(false),
    [peerRead, setPeerRead] = useState(0);
  const cursor = useRef(0),
    acknowledged = useRef(0),
    nonce = useRef(null),
    alive = useRef(true),
    list = useRef(null),
    follow = useRef(true);
  const id = conversation?.id;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    onState?.("messaging", { dirty: !!draft, busy });
  }, [draft, busy, onState]);
  useEffect(() => () => onState?.("messaging", null), [onState]);
  useEffect(() => {
    const guard = (event) => {
      if (draft || busy) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [draft, busy]);
  useEffect(() => {
    if (!id) return;
    let active = true,
      timer;
    async function sync() {
      try {
        const result = await api.messages(
          id,
          cursor.current ? { after: cursor.current } : {},
        );
        if (!active) return;
        if (!cursor.current) setOlder(result.has_older);
        setMessages((previous) => mergeMessages(previous, result.messages));
        cursor.current = Math.max(
          cursor.current,
          ...result.messages.map((m) => m.id),
        );
        setPeerRead(result.peer_read_id);
        setSyncError(null);
        if (
          cursor.current > acknowledged.current &&
          follow.current &&
          document.visibilityState !== "hidden"
        ) {
          await api.readMessages(id, cursor.current);
          if (active) acknowledged.current = cursor.current;
        }
      } catch (e) {
        if (active) setSyncError(e);
      } finally {
        if (active) {
          setLoading(false);
          timer = setTimeout(sync, 4000);
        }
      }
    }
    sync();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id]);
  useEffect(() => {
    if (follow.current && list.current)
      list.current.scrollTop = list.current.scrollHeight;
  }, [messages]);
  async function loadOlder() {
    setOlderBusy(true);
    setError(null);
    const container = list.current,
      height = container?.scrollHeight || 0;
    follow.current = false;
    try {
      const result = await api.messages(id, { before: messages[0].id });
      if (!alive.current) return;
      setMessages((previous) => mergeMessages(previous, result.messages));
      setOlder(result.has_older);
      requestAnimationFrame(() => {
        if (container) container.scrollTop += container.scrollHeight - height;
      });
    } catch (e) {
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setOlderBusy(false);
    }
  }
  async function send(event) {
    event.preventDefault();
    if (busy || !draft.trim()) return;
    setBusy(true);
    setError(null);
    nonce.current ||= deliveryNonce();
    try {
      const result = await api.sendMessage(id, {
        body: draft.trim(),
        client_nonce: nonce.current,
      });
      if (!alive.current) return;
      follow.current = true;
      setMessages((previous) => mergeMessages(previous, [result.message]));
      setDraft("");
      nonce.current = null;
      if (!id) onCreated(result.conversation);
    } catch (e) {
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <section className="message-thread" aria-label="Conversation privée">
      <header className="message-header">
        <h2>{admin ? conversation?.user?.name || "Client" : "Équipe AXORA"}</h2>
        <p>
          {admin
            ? conversation?.user?.email
            : "Échangez directement avec nos administrateurs. Chacun signe ses réponses."}
        </p>
        <small>
          Messages privés · actualisation automatique toutes les 4 secondes
        </small>
      </header>
      {syncError && (
        <p className="notice" role="status">
          Synchronisation interrompue. Nouvelle tentative automatique…{" "}
          {syncError.message}
        </p>
      )}
      <div
        className="message-history"
        ref={list}
        onScroll={() => {
          const el = list.current;
          follow.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        {older && (
          <button
            className="text-link"
            disabled={olderBusy}
            onClick={loadOlder}
          >
            {olderBusy ? "Chargement…" : "Voir les messages précédents"}
          </button>
        )}
        {loading ? (
          <p role="status">Chargement des échanges…</p>
        ) : (
          !messages.length && (
            <div className="message-empty">
              <h3>Commençons la discussion</h3>
              <p>
                Présentez votre projet ou posez votre question. L’équipe vous
                répondra ici.
              </p>
            </div>
          )
        )}
        <div
          role="log"
          aria-label="Messages"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((message) => (
            <article
              key={message.id}
              className={
                "message-bubble" +
                (message.sender_id === user.id ? " mine" : "")
              }
            >
              <strong>
                {message.sender_name}
                {message.is_staff ? " · AXORA" : ""}
              </strong>
              <p>{message.body}</p>
              <small>
                {dateLabel(message.created_at)}
                {message.sender_id === user.id && (
                  <span>
                    {" "}
                    ·{" "}
                    {message.id <= peerRead
                      ? admin
                        ? "Vu par le client"
                        : "Vu par l’équipe"
                      : "Envoyé"}
                  </span>
                )}
              </small>
            </article>
          ))}
        </div>
      </div>
      <form className="message-composer" onSubmit={send}>
        <Errors error={error} />
        <label htmlFor="message-draft">Votre message</label>
        <textarea
          id="message-draft"
          rows={3}
          maxLength={5000}
          value={draft}
          disabled={busy}
          onChange={(event) => {
            setDraft(event.target.value);
            nonce.current = null;
          }}
          placeholder="Écrivez à l’équipe…"
          required
        />
        <div>
          <small>{draft.length}/5 000 · Entrée pour une nouvelle ligne</small>
          <button className="btn" disabled={busy || loading || !draft.trim()}>
            {busy ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function Messaging({ admin = false, onState: providedOnState }) {
  const { user } = useAuth();
  const layout = useOutletContext();
  const onState = providedOnState || layout?.onState;
  const [conversation, setConversation] = useState(null),
    [ready, setReady] = useState(admin),
    [error, setError] = useState(null);
  const [inbox, setInbox] = useState(null),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [unread, setUnread] = useState(false),
    [retry, setRetry] = useState(0);
  const state = useRef({});
  const report = React.useCallback(
    (key, value) => {
      state.current = value || {};
      onState?.(key, value);
    },
    [onState],
  );
  useEffect(() => {
    let active = true,
      timer;
    async function refresh() {
      try {
        const result = admin
          ? await api.conversations(page, query, unread)
          : await api.ownConversation();
        if (!active) return;
        if (admin) setInbox(result);
        else {
          setConversation(result.conversation);
          setReady(true);
        }
        setError(null);
      } catch (e) {
        if (active) setError(e);
      } finally {
        if (active && admin) timer = setTimeout(refresh, 4000);
      }
    }
    refresh();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [admin, page, query, unread, retry]);
  function select(item) {
    if (item.id === conversation?.id || state.current.busy) return;
    if (
      state.current.dirty &&
      !window.confirm("Abandonner le message non envoyé ?")
    )
      return;
    setConversation(item);
  }
  const content = (
    <>
      <Errors error={error} />
      {error && (
        <button className="text-link" onClick={() => setRetry((n) => n + 1)}>
          Réessayer
        </button>
      )}
      <div className={admin ? "messaging-layout" : ""}>
        {admin && (
          <aside className="message-inbox" aria-label="Conversations clients">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setQuery(search.trim());
              }}
            >
              <label htmlFor="message-search">Rechercher un client</label>
              <input
                id="message-search"
                value={search}
                maxLength={150}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, email, entreprise"
              />
              <button className="btn secondary">Rechercher</button>
              <label>
                <input
                  type="checkbox"
                  checked={unread}
                  onChange={(e) => {
                    setUnread(e.target.checked);
                    setPage(1);
                  }}
                />{" "}
                Non lus uniquement
              </label>
            </form>
            {!inbox && !error && (
              <p className="message-inbox-empty">Chargement…</p>
            )}
            {inbox?.data.length === 0 && (
              <p className="message-inbox-empty">
                Aucune conversation trouvée.
              </p>
            )}
            {inbox?.data.map((item) => (
              <button
                className="message-contact"
                key={item.id}
                aria-pressed={conversation?.id === item.id}
                disabled={state.current.busy}
                onClick={() => select(item)}
              >
                <strong>{item.user?.name}</strong>
                {item.unread_count > 0 && (
                  <span className="message-count">
                    {item.unread_count} non lu(s)
                  </span>
                )}
                <small>{item.user?.company_name || item.user?.email}</small>
                <p>{item.last_message?.body}</p>
                <small>{dateLabel(item.last_message_at)}</small>
              </button>
            ))}
            <Pagination data={inbox} onPage={setPage} />
          </aside>
        )}
        {ready && (!admin || conversation) ? (
          <Thread
            key={conversation?.id || "new"}
            conversation={conversation}
            admin={admin}
            onCreated={setConversation}
            onState={report}
          />
        ) : (
          <div className="card message-empty">
            <p>
              {admin
                ? "Sélectionnez une conversation pour répondre au client."
                : error
                  ? "La messagerie est momentanément indisponible."
                  : "Chargement de votre messagerie…"}
            </p>
          </div>
        )}
      </div>
    </>
  );
  return admin ? (
    content
  ) : (
    <section className="page">
      <Link
        className="text-link"
        to="/mon-espace"
        onClick={(e) => {
          if (
            state.current.busy ||
            (state.current.dirty &&
              !window.confirm("Abandonner le message non envoyé ?"))
          )
            e.preventDefault();
        }}
      >
        ← Mon espace
      </Link>
      <div className="page-heading">
        <span className="eyebrow">
          {user.type === "entreprise" ? "Espace organisation" : "Espace client"}
        </span>
        <h1>
          {user.type === "entreprise" ? "Messagerie AXORA" : "Ma messagerie"}
        </h1>
        <p>Vos échanges avec l’équipe, conservés au même endroit.</p>
      </div>
      {content}
    </section>
  );
}
