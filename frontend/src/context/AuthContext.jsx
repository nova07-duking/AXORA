import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const clear = () => {
      localStorage.removeItem("axora_token");
      setUser(null);
      setAuthError("");
    };
    window.addEventListener("axora:unauthorized", clear);
    return () => window.removeEventListener("axora:unauthorized", clear);
  }, []);

  // Au chargement de l'app : si un token existe déjà, on récupère l'utilisateur.
  useEffect(() => {
    setLoading(true);
    setAuthError("");
    let active = true;
    const token = localStorage.getItem("axora_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((data) => {
        if (active && localStorage.getItem("axora_token") === token)
          setUser(data);
      })
      .catch((e) => {
        if (
          active &&
          localStorage.getItem("axora_token") === token &&
          e.status !== 401
        )
          setAuthError(
            "Impossible de vérifier votre session. Veuillez réessayer.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  async function register(payload) {
    setAuthError("");
    const data = await api.register(payload);
    localStorage.setItem("axora_token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function login(payload) {
    setAuthError("");
    const data = await api.login(payload);
    localStorage.setItem("axora_token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await api.logout();
    } catch {
      // même si l'appel échoue, on déconnecte localement
    }
    localStorage.removeItem("axora_token");
    setUser(null);
    setAuthError("");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        authError,
        refresh: () => setRetry((n) => n + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  return ctx;
}
