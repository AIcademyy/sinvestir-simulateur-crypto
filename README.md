# Simulateur Crypto-monnaie — S'investir Simulateurs

Transposition du [simulateur crypto](https://sinvestir.fr/simulateur-crypto-monnaie/) de sinvestir.fr
au format et aux standards visuels de [simulateurs.sinvestir.fr](https://simulateurs.sinvestir.fr/),
réalisée dans le cadre du test technique Développeur IA.

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Aucune clé d'API n'est nécessaire (CoinGecko public API).

- `/` — page complète, dans la mise en page de la suite (sidebar + header, comme `simulateurs.sinvestir.fr`).
- `/embed` — version dépouillée du même composant, sans sidebar ni header, pensée pour être chargée
  dans une `<iframe>` depuis `sinvestir.fr`.
- `/mes-simulations` — historique des simulations, lien réel dans la sidebar (pas juste un libellé
  statique). Fonctionne en lecture vide tant que Supabase n'est pas configuré (voir plus bas).

## Ce que fait le simulateur

Reprend la logique du simulateur d'origine :

- **Actif numérique** : sélection parmi les ~60 plus grosses cryptomonnaies par capitalisation
  (liste dynamique via l'API CoinGecko, pas une liste figée en dur).
- **Montant** par versement, en euros.
- **Fréquence** : investissement unique, ou DCA (par jour / semaine / mois).
- **Période** : dates de début et de fin.
- **Résultats** : Investi, Acquis (quantité de crypto), Prix moyen d'acquisition, Capital final,
  Performance (%), plus un graphique investi vs. valeur du portefeuille dans le temps — calculés à
  partir des prix de marché historiques réels de la période choisie.

## Partis pris techniques

- **Next.js (App Router) + TypeScript + Tailwind CSS** — alignement direct avec la stack interne
  S'investir (Next.js, Vercel).
- **CoinGecko API publique** comme source de prix historiques — gratuite, sans clé, couvre des
  milliers d'actifs. Limite connue et assumée : le plan gratuit restreint l'historique aux **365
  derniers jours** (le sélecteur de date l'impose côté UI, et l'API renvoie une erreur explicite
  sinon). En production, on basculerait sur un plan CoinGecko payant (ou une source équivalente)
  pour lever cette limite.
- **Calcul fait côté serveur** (route handlers `/api/coins` et `/api/simulate`), pas dans le
  navigateur : ça évite d'exposer les appels CoinGecko au rate-limit du visiteur, ça permet de
  mettre en cache les réponses (`revalidate` Next.js), et ça garde le composant front simple à
  embarquer.
- **Composant `Simulator` unique, autonome et réutilisable** (`src/components/Simulator.tsx`) :
  une seule prop (`embedded`) pour basculer entre la mise en page "suite" et la mise en page
  "embed nu". C'est ce même composant qui est monté sur `/` (avec `SuiteShell`, qui imite la
  sidebar/header de `simulateurs.sinvestir.fr`) et sur `/embed`. Aucune dépendance à un état
  global ni à Supabase : il pourrait être copié tel quel dans le repo de la suite.
- **Recharts** pour le graphique — léger, déclaratif, pas de canvas custom à maintenir.
- **Design** : thème sombre, police Lexend, accents bleu (`#2563eb` / dégradé `#0049c6` →
  `#04265f`) et or (`#f5c542`), cards arrondies avec en-tête dégradé — repris directement de
  `simulateurs.sinvestir.fr` (capture d'écran de la page d'accueil, palette extraite du bundle
  CSS Nuxt UI du site).

## Bonus — persistance Supabase & point d'automatisation

Le brief précise que les vraies missions porteront sur des outils internes, des agents IA et des
automatisations (HubSpot/WooCommerce/Sheets…), pas sur des simulateurs. Plutôt que de laisser ça à
l'état de promesse dans ce README, deux briques tournent réellement dans le code :

1. **Persistance Supabase** (`src/lib/supabase.ts`, `supabase/schema.sql`, `/api/simulations`) —
   chaque simulation "settled" (l'utilisateur arrête de bouger les curseurs) est sauvegardée dans
   une table `simulations`, et `/mes-simulations` l'affiche. Ça transforme l'item "Mes simulations"
   de la sidebar — présent dans le design d'origine mais sans contenu — en fonctionnalité réelle.
   Le client Supabase est créé de façon paresseuse et renvoie `null` si les variables d'env
   `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` ne sont pas définies : l'app continue de fonctionner
   sans persistance (c'est l'état du déploiement de démo tel que livré), elle ne plante jamais faute
   de config.

2. **Point d'automatisation** (`src/lib/automation.ts`) — à chaque simulation sauvegardée,
   `emitAutomationEvent("simulation.completed", …)` poste le payload complet (en fire-and-forget,
   sans jamais bloquer ni faire échouer la requête) vers `AUTOMATION_WEBHOOK_URL` si elle est
   définie. C'est typiquement le **Webhook node d'un workflow n8n** : on y branche par exemple un
   nœud HubSpot (créer/mettre à jour un contact taggé "a simulé du Bitcoin") ou un nœud Google
   Sheets (ligne de reporting par simulation), sans toucher au code de l'app — exactement le genre
   d'automatisation interne mentionné dans le brief.

**Pour activer ces deux briques** : créer un projet Supabase gratuit, exécuter
`supabase/schema.sql` dans son éditeur SQL, puis dans Vercel → Settings → Environment Variables,
ajouter `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, et optionnellement `AUTOMATION_WEBHOOK_URL`
(une URL de Webhook n8n). Aucun changement de code nécessaire.

## Pour une intégration réelle dans la suite

- Le composant `Simulator` n'a aucune dépendance à l'auth ou à Supabase : il suffirait de le
  déplacer dans le repo Nuxt/Next de la suite et de le brancher sur leur système de design (boutons,
  `Card`, etc.) au lieu des classes Tailwind ad hoc utilisées ici.
- Pour l'embed sur `sinvestir.fr`, `/embed` est conçu pour tourner dans une `<iframe>` sans aucune
  configuration supplémentaire (pas de `X-Frame-Options` restrictif côté Next ici) :
  ```html
  <iframe src="https://<deploy>.vercel.app/embed" width="100%" height="900" style="border:0" />
  ```

## Suggestions d'amélioration pour S'investir

- **Comparaison de scénarios sauvegardés** : la sauvegarde existe désormais (voir section bonus
  ci-dessus) — l'étape suivante logique est de permettre de nommer 2-3 simulations et de les
  comparer côte à côte (ex. DCA mensuel vs. lump sum sur le même actif), plutôt que de les lister
  une par une.
- **Comparateur multi-actifs** : superposer 2-3 cryptos (ou crypto vs. ETF/PEA) sur le même
  graphique, pour répondre à "j'aurais dû investir où ?" sans ressaisir la simulation trois fois.
- **Partage/export** : un lien public (paramètres encodés dans l'URL) ou export PDF du résultat,
  utile pour un conseiller qui veut envoyer une simulation à un client — et un bon levier
  d'acquisition (chaque lien partagé ramène du trafic vers `simulateurs.sinvestir.fr`).
- **Cache des séries de prix côté infra** (Supabase ou KV) plutôt qu'au niveau du `fetch` Next :
  utile si plusieurs simulateurs (crypto, mais aussi futurs simulateurs d'actifs cotés) consomment
  les mêmes séries de prix — évite de re-payer le rate-limit CoinGecko à chaque utilisateur.

## Stack

Next.js · TypeScript · Tailwind CSS · Recharts · CoinGecko API · Supabase (persistance) ·
Webhook compatible n8n (automatisation)
