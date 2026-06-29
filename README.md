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
  S'investir (Next.js, Vercel). Pas de Supabase/n8n ici : ce test est un outil de calcul stateless,
  sans besoin de persistance ni d'automatisation côté back-office.
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

- **Sauvegarde des simulations** ("Mes simulations" existe déjà dans la sidebar) : permettre de
  nommer et comparer plusieurs scénarios côte à côte (ex. DCA mensuel vs. lump sum) sur un même
  actif — c'est la question que se pose naturellement tout utilisateur après une première
  simulation.
- **Comparateur multi-actifs** : superposer 2-3 cryptos (ou crypto vs. ETF/PEA) sur le même
  graphique, pour répondre à "j'aurais dû investir où ?" sans ressaisir la simulation trois fois.
- **Partage/export** : un lien public (paramètres encodés dans l'URL) ou export PDF du résultat,
  utile pour un conseiller qui veut envoyer une simulation à un client — et un bon levier
  d'acquisition (chaque lien partagé ramène du trafic vers `simulateurs.sinvestir.fr`).
- **Cache des séries de prix côté infra** (Supabase ou KV) plutôt qu'au niveau du `fetch` Next :
  utile si plusieurs simulateurs (crypto, mais aussi futurs simulateurs d'actifs cotés) consomment
  les mêmes séries de prix — évite de re-payer le rate-limit CoinGecko à chaque utilisateur.

## Stack

Next.js · TypeScript · Tailwind CSS · Recharts · CoinGecko API
