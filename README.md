# AXORA — site vitrine et espace client

Le projet exécutable est composé de `frontend/` (React, Vite) et `axora-backend/` (Laravel, Sanctum, PostgreSQL). `backend/` conserve une copie du code applicatif pour l’ancienne procédure d’installation ; développez dans `axora-backend/`.

## Fonctions disponibles

- Accueil, cinq services détaillés, histoire, mission, vision, objectifs et présentation de l’équipe.
- Coordonnées et lien Google Maps modifiables par l’équipe.
- Inscription particulier/entreprise, connexion Bearer, déconnexion et récupération de mot de passe.
- Demandes de devis et d’audit persistantes.
- Demandes de rendez-vous en visio, au téléphone ou sur place.
- Historique paginé, statuts, réponses de l’équipe, annulation d’audits et de rendez-vous.
- Administration réservée aux comptes habilités : tableau de bord, activité récente, rendez-vous à venir, recherche par client/email/sujet/numéro, filtres de statut et tri, traitement des dossiers, modification des services et des contenus publics. Les brouillons sont signalés avant un changement de rubrique et la navigation de l’administration est bloquée pendant un enregistrement.
- Assistant IA connecté côté serveur à l’API Responses d’OpenAI, lorsqu’une clé et un modèle sont configurés. Sans configuration, la fenêtre présente les liens utiles et indique que l’IA est indisponible.
- Navigation mobile, formulaires étiquetés, états de chargement/erreur, page 404 et information sur l’usage des données.

Un rendez-vous est une **demande d’horaire**, pas une réservation automatique. L’équipe le confirme. Deux demandes ne peuvent pas être confirmées au même instant. Les heures affichées et saisies sont celles de Libreville (UTC+1) ; la base conserve les dates en UTC. Il n’y a pas encore de synchronisation avec un agenda externe. Les réponses sont consultables dans l’espace client ; aucune notification commerciale automatique n’est envoyée.

## Lancer le site

Dans un premier terminal :

```powershell
cd axora-backend
composer install
# Seulement si .env n’existe pas : Copy-Item .env.example .env
# Seulement pour une installation neuve : php artisan key:generate
php artisan migrate
php artisan db:seed --class=ServiceSeeder
php artisan serve --host=127.0.0.1 --port=8000
```

Dans un second terminal :

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Ouvrir http://127.0.0.1:5173. Le frontend appelle `/api` via le proxy Vite vers le backend local. `VITE_API_URL` peut définir une autre URL d’API.

En développement rapide, la base SQLite se trouve dans `axora-backend/database/database.sqlite`. PostgreSQL est également pris en charge et constitue le choix recommandé pour un hébergement. Le fichier `compose.postgres.yaml` démarre PostgreSQL 17 en local sur `127.0.0.1:55432`; `php artisan axora:import-sqlite <chemin-vers-la-copie.sqlite>` transfère les données vers une base PostgreSQL vide après migration. Ne lancez jamais cet import sur une base contenant déjà des tables AXORA. Une copie `database.before-portal-*.sqlite` a été réalisée avant l’évolution initiale.

## Donner accès à l’administration

1. Créer normalement le compte de la personne autorisée sur le site.
2. Depuis `axora-backend/`, exécuter :

```powershell
php artisan axora:admin adresse-du-compte
```

3. Recharger le site puis ouvrir `/administration` ou le lien de gestion dans « Mon espace ».

Retirer cet accès :

```powershell
php artisan axora:admin adresse-du-compte --revoke
```

Aucun compte administrateur, mot de passe partagé ou privilège automatique n’a été créé. Le champ administrateur n’est pas accepté à l’inscription. Les contrôles sont effectués côté serveur.

Dans l’onglet « Entreprise & équipe », renseigner l’adresse exacte, le lien Google Maps, le téléphone, les horaires, les textes validés et les membres de l’équipe. Les photos de membres acceptent une URL HTTPS. Les personnes sans photo sont représentées par leurs initiales.

## Chatbot IA

Configurer uniquement dans `axora-backend/.env` :

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=
```

Choisir un modèle accessible au compte API, puis exécuter `php artisan config:clear` après modification. Ne jamais placer de clé dans une variable `VITE_*` ou dans le code du navigateur.

L’intégration suit https://developers.openai.com/api/reference/cli/resources/responses/methods/create :
appel serveur, délai maximal, limites de taille et de fréquence, réponses d’erreur publiques sans détail du fournisseur, `store: false`. La fenêtre demande l’accord de l’utilisateur avant transmission. Seuls les messages du chat et le contexte public d’AXORA sont envoyés ; les comptes et dossiers clients ne sont pas transmis. Le chatbot ne dispose d’aucun outil d’écriture ni de réservation. Les tests du fournisseur utilisent des réponses simulées, sans appel payant.

## Récupération de mot de passe

Configurer une messagerie opérationnelle avec les paramètres `MAIL_*` de Laravel et `FRONTEND_URL` (origine réelle du site). Sans messagerie, le formulaire indique son indisponibilité au lieu de prétendre qu’un email a été envoyé.

Le lien expire selon la configuration du broker Laravel. Une réinitialisation réussie révoque tous les tokens de connexion du compte. Les tests interceptent les notifications et n’envoient aucun email réel.

## Base de données

- `users` : comptes et indicateur administrateur.
- `services` : catalogue public.
- `quote_requests` : devis, statut et réponse.
- `client_requests` : audits/rendez-vous, propriétaire, périmètre, date, format, statut, réponse et lien de réunion.
- `conversations`, `conversation_messages`, `conversation_reads` : messagerie clients, historique et lectures par administrateur.
- `site_settings` : coordonnées, textes et équipe.
- `personal_access_tokens` : tokens hachés avec expiration.
- `password_reset_tokens` : récupération de compte.
- Tables Laravel de cache/verrous/tâches.

Les historiques sont filtrés par propriétaire et paginés. Les créations ignorent les champs de propriétaire/statut fournis par le navigateur. Les accès de gestion exigent un compte administrateur. Les rendez-vous confirmés disposent d’une contrainte d’unicité en base.

## Vérifier

```powershell
cd frontend
npm test
npm run build
```

```powershell
cd axora-backend
php vendor/phpunit/phpunit/phpunit
```

Les tests backend utilisent SQLite **en mémoire**, indépendamment de la base locale. Ils couvrent l’authentification, les permissions, l’isolation entre clients, les audits, les dates, les conflits de confirmation, les réponses de l’équipe, les contenus, le chatbot et les réinitialisations.

La vérification actuelle sous PHP 8.5 passe sans avertissement de dépréciation : 33 tests backend et 18 tests frontend. Les tests React couvrent les changements de rubrique, les brouillons, les enregistrements en cours et les erreurs de chargement. La compilation de production et les réponses HTTP locales ont également été vérifiées. Les diagnostics PHP sont dirigés vers les journaux à l’entrée HTTP pour préserver les réponses JSON.

## Avant la mise en ligne

La mise en ligne complète nécessite un hébergement capable d’exécuter PHP/Laravel et de conserver la base de données. Le runtime JavaScript de Sites ne peut pas exécuter ce backend PHP tel quel. Il faut conserver l’architecture et déployer Laravel sur un hébergement adapté, puis servir le frontend et relayer `/api` vers Laravel (ou configurer `VITE_API_URL` et CORS).

- Définir le domaine, HTTPS, `APP_URL`, `FRONTEND_URL`, `APP_ENV=production`, `APP_DEBUG=false`.
- Exposer uniquement les fichiers publics ; ne jamais exposer `.env`, `database/`, `storage/` ou les sources privées.
- Configurer les sauvegardes, la messagerie, le fournisseur IA et les accès de gestion.
- Faire valider les coordonnées, l’histoire, les objectifs, les membres et les photos de l’équipe.
- Compléter les informations d’éditeur/hébergeur et les règles de conservation des données correspondant à l’exploitation réelle.

L’adresse exacte, le téléphone, les portraits réels, les compléments d’histoire, le compte administrateur, le fournisseur IA et l’hébergement n’ont pas été fournis. Ils ne sont pas inventés. Le nom du fondateur et l’ancrage à Libreville proviennent du code initial.

## Images

Les photos intégrées sont des illustrations de l’infrastructure et du développement, pas des photos des locaux ou de l’équipe AXORA. Crédits et sources : `frontend/public/images/CREDITS.md`.

## Messagerie privée client / administrateurs

- Client : ouvrir `/mon-espace`, puis « Ouvrir ma messagerie » (`/mon-espace/messages`). Le premier envoi crée sa conversation avec AXORA.
- Administrateurs : ouvrir `/administration`, rubrique « Messagerie clients ». Rechercher un client, filtrer les non lus, sélectionner un échange et répondre. Tous les administrateurs partagent les conversations ; chaque réponse affiche son auteur.
- Les échanges sont enregistrés dans PostgreSQL. Les droits sont contrôlés sur chaque lecture et chaque envoi. Les compteurs de lecture sont individuels pour les administrateurs.
- Les nouveaux messages sont récupérés automatiquement toutes les quatre secondes tant que la page reste ouverte. Il n’y a pas de notification email ou push. Les réponses de cette messagerie sont rédigées par des personnes.
- Historique par lots de 50, messages de 5 000 caractères maximum, 30 envois par minute, protection contre les doublons lors d’une nouvelle tentative et conservation du texte si l’envoi échoue. Les pièces jointes ne sont pas prises en charge.
- Sur un autre environnement existant, appliquer `php artisan migrate --force` depuis `axora-backend` après sauvegarde de la base. La migration ajoute trois tables et conserve les données existantes.
- Tests dédiés : `tests/Feature/MessagingTest.php` et `frontend/tests/messaging.test.mjs` (confidentialité, réponses de plusieurs administrateurs, lectures, historique, nouvelles tentatives et changement de conversation).
