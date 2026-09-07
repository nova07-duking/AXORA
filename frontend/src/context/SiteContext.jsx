import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
const SiteContext = createContext(null);
export function SiteProvider({ children }) {
  const [site, setSite] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function reload() {
    setLoading(true);
    setError("");
    try {
      setSite(await api.getSite());
    } catch {
      setError(
        "Les informations de l’entreprise sont momentanément indisponibles.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  return (
    <SiteContext.Provider
      value={{ site, loading, error, reload, applySite: setSite }}
    >
      {children}
    </SiteContext.Provider>
  );
}
export const useSite = () => useContext(SiteContext);
