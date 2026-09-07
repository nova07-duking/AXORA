import React from "react";
import { useSite } from "../context/SiteContext";
export default function Privacy() {
  const { site } = useSite();
  return (
    <section className="page reading">
      <span className="eyebrow">Vos informations</span>
      <h1>Confidentialité</h1>
      <h2>Compte et demandes</h2>
      <p>
        Le site enregistre les informations de votre compte, vos coordonnées et
        vos demandes de devis, d’audit ou de rendez-vous. Elles permettent à
        l’équipe AXORA de traiter votre besoin et de vous répondre dans votre
        espace client.
      </p>
      <h2>Accès à vos informations</h2>
      <p>
        Vous pouvez consulter vos demandes après connexion. L’équipe disposant
        d’un accès de gestion peut consulter les informations nécessaires à leur
        traitement. Ne transmettez pas de mots de passe ou de documents
        confidentiels dans les formulaires.
      </p>
      <h2>Messagerie avec l’équipe</h2>
      <p>
        Vos messages privés et le nom de leurs auteurs sont enregistrés dans la
        base de données du site. Vous et les administrateurs AXORA pouvez
        consulter ces échanges. Un indicateur signale la lecture des messages.
        Cette messagerie ne transmet pas vos échanges à un fournisseur
        d’intelligence artificielle.
      </p>
      <h2>Assistant IA</h2>
      <p>
        Lorsque l’assistant est disponible, le démarrage du chat nécessite votre
        accord. Les messages de la conversation sont transmis à OpenAI pour
        générer les réponses. Votre compte et vos demandes ne sont pas transmis
        au chatbot. La conversation n’est pas enregistrée dans la base de
        données du site ; elle reste dans la page jusqu’à son effacement ou son
        rechargement. Le traitement par le fournisseur est soumis à ses propres
        conditions.
      </p>
      <h2>Stockage dans votre navigateur</h2>
      <p>
        Un jeton d’authentification est conservé dans votre navigateur pour
        maintenir votre connexion. La déconnexion supprime ce jeton local. Le
        site n’intègre pas d’outil publicitaire ni de mesure d’audience.
      </p>
      <h2>Nous contacter au sujet de vos données</h2>
      <p>
        Pour une demande de correction ou de suppression de vos informations,
        contactez l’équipe
        {site?.company.email && (
          <>
            {" "}
            à{" "}
            <a className="text-link" href={"mailto:" + site.company.email}>
              {site.company.email}
            </a>
          </>
        )}
        .
      </p>
    </section>
  );
}
