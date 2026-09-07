const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Petit wrapper fetch qui ajoute automatiquement le token Sanctum (Bearer)
 * quand il est présent dans le localStorage, et normalise les erreurs
 * renvoyées par Laravel (422 de validation, 401/403, etc.).
 */
async function request(path, { method = "GET", body, auth = false } = {}) {
  const sentToken = auth ? localStorage.getItem("axora_token") : null;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (auth) {
    if (sentToken) headers.Authorization = `Bearer ${sentToken}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(path === "/chat" ? 45000 : 15000),
    });
  } catch {
    throw new Error(
      "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (
      res.status === 401 &&
      auth &&
      localStorage.getItem("axora_token") === sentToken
    )
      window.dispatchEvent(new Event("axora:unauthorized"));
    const error = new Error(
      data?.message ||
        (res.status === 429
          ? "Trop de tentatives. Patientez une minute puis réessayez."
          : "Une erreur est survenue. Veuillez réessayer."),
    );
    error.status = res.status;
    error.errors = data?.errors || null; // erreurs de validation Laravel (422)
    throw error;
  }

  if (data === null)
    throw new Error("La réponse du serveur est illisible. Veuillez réessayer.");
  return data;
}

export const api = {
  ownConversation: () => request("/messaging", { auth: true }),
  conversations: (page = 1, search = "", unread = false) =>
    request(
      `/admin/conversations?${new URLSearchParams({ page, search, unread: unread ? 1 : 0 })}`,
      { auth: true },
    ),
  messages: (id, cursor = {}) =>
    request(`/messaging/${id}/messages?${new URLSearchParams(cursor)}`, {
      auth: true,
    }),
  sendMessage: (id, body) =>
    request(id ? `/messaging/${id}/messages` : "/messaging", {
      method: "POST",
      body,
      auth: true,
    }),
  readMessages: (id, message_id) =>
    request(`/messaging/${id}/read`, {
      method: "POST",
      body: { message_id },
      auth: true,
    }),
  forgotPassword: (body) =>
    request("/forgot-password", { method: "POST", body }),
  resetPassword: (body) => request("/reset-password", { method: "POST", body }),
  register: (payload) =>
    request("/register", { method: "POST", body: payload }),
  login: (payload) => request("/login", { method: "POST", body: payload }),
  logout: () => request("/logout", { method: "POST", auth: true }),
  me: () => request("/me", { auth: true }),

  getServices: () => request("/services"),

  getMyQuoteRequests: (page = 1) =>
    request(`/quote-requests?page=${page}`, { auth: true }),
  createQuoteRequest: (payload) =>
    request("/quote-requests", { method: "POST", body: payload, auth: true }),
  getSite: () => request("/site"),
  getRequests: (page = 1) =>
    request(`/client-requests?page=${page}`, { auth: true }),
  createRequest: (body) =>
    request("/client-requests", { method: "POST", body, auth: true }),
  cancelRequest: (id) =>
    request(`/client-requests/${id}/cancel`, { method: "PATCH", auth: true }),
  chat: (messages) =>
    request("/chat", { method: "POST", body: { messages, consent: true } }),
  adminDashboard: () => request("/admin/dashboard", { auth: true }),
  adminRequests: (kind, page = 1, filters = {}) =>
    request(
      `/admin/requests?${new URLSearchParams({ kind, page, ...filters })}`,
      { auth: true },
    ),
  updateRequest: (kind, id, body) =>
    request(`/admin/requests/${kind}/${id}`, {
      method: "PATCH",
      body,
      auth: true,
    }),
  updateSite: (body) =>
    request("/admin/site", { method: "PUT", body, auth: true }),
  updateService: (id, body) =>
    request(`/admin/services/${id}`, { method: "PUT", body, auth: true }),
};
