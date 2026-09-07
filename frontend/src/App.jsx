import React, { useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatWidget from "./components/ChatWidget";
import Home from "./pages/Home";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import QuoteRequest from "./pages/QuoteRequest";
import MySpace from "./pages/MySpace";
import Messaging from "./components/Messaging";
import ClientLayout from "./components/ClientLayout";
import ClientRequest from "./pages/ClientRequest";
import Admin from "./pages/Admin";
import Privacy from "./pages/Privacy";
import PasswordReset from "./pages/PasswordReset";
function NavigationEffects() {
  const location = useLocation();
  useEffect(() => {
    const titles = {
      "/": "Solutions numériques à Libreville",
      "/services": "Nos services",
      "/audit": "Demander un audit",
      "/rendez-vous": "Prendre rendez-vous",
      "/a-propos": "Entreprise et équipe",
      "/contact": "Contact et localisation",
      "/connexion": "Connexion",
      "/inscription": "Inscription",
      "/devis": "Demander un devis",
      "/mon-espace": "Espace client",
      "/mon-espace/messages": "Ma messagerie",
      "/administration": "Gestion AXORA",
      "/confidentialite": "Confidentialité",
      "/mot-de-passe-oublie": "Mot de passe oublié",
      "/reinitialiser-mot-de-passe": "Nouveau mot de passe",
    };
    document.title =
      (titles[location.pathname] || "Page introuvable") + " | AXORA";
    if (!location.hash) window.scrollTo(0, 0);
    else {
      const timer = setTimeout(
        () => document.getElementById(location.hash.slice(1))?.scrollIntoView(),
        150,
      );
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);
  return null;
}
export default function App() {
  const pathname = useLocation().pathname;
  const isAdminPage = pathname === "/administration";
  const isClientPage = [
    "/mon-espace",
    "/mon-espace/messages",
    "/devis",
    "/audit",
    "/rendez-vous",
  ].includes(pathname.replace(/\/$/, ""));
  const isWorkspace = isAdminPage || isClientPage;
  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <NavigationEffects />
      {!isWorkspace && <Nav />}
      <main id="contenu">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/mot-de-passe-oublie" element={<PasswordReset />} />
          <Route
            path="/reinitialiser-mot-de-passe"
            element={<PasswordReset />}
          />
          <Route path="/confidentialite" element={<Privacy />} />
          <Route
            element={
              <ProtectedRoute>
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/devis" element={<QuoteRequest />} />
            <Route
              path="/audit"
              element={<ClientRequest key="audit" kind="audit" />}
            />
            <Route
              path="/rendez-vous"
              element={<ClientRequest key="appointment" kind="appointment" />}
            />
            <Route path="/mon-espace" element={<MySpace />} />
            <Route path="/mon-espace/messages" element={<Messaging />} />
          </Route>
          <Route
            path="/administration"
            element={
              <ProtectedRoute admin>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <section className="page empty">
                <span className="eyebrow">404</span>
                <h1>Cette page n’existe pas.</h1>
                <p>Retrouvez nos services ou revenez à l’accueil.</p>
                <Link className="btn" to="/">
                  Retour à l’accueil
                </Link>
              </section>
            }
          />
        </Routes>
      </main>
      {!isWorkspace && <Footer />}
      {!isWorkspace && <ChatWidget />}
    </>
  );
}
