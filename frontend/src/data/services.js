import { Shield, Database, Code2, Sparkles, Wifi } from "lucide-react";

// Le contenu (nom, description) vient du backend Laravel (table `services`).
// On garde ici seulement l'association slug -> icône / couleur, propre au front.
export const SERVICE_UI = {
  cybersecurite: { icon: Shield, tint: "bg-blue-50 text-blue-600" },
  data: { icon: Database, tint: "bg-cyan-50 text-cyan-600" },
  dev: { icon: Code2, tint: "bg-blue-50 text-blue-600" },
  ia: { icon: Sparkles, tint: "bg-cyan-50 text-cyan-600" },
  iot: { icon: Wifi, tint: "bg-blue-50 text-blue-600" },
};

export const NEED_TYPES = [
  { value: "audit", label: "Audit / diagnostic" },
  { value: "developpement", label: "Développement d'un projet" },
  { value: "conseil", label: "Conseil / accompagnement" },
  { value: "maintenance", label: "Maintenance / supervision" },
  { value: "autre", label: "Autre besoin" },
];
