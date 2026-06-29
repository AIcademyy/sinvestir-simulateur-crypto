# Automatisation n8n — Google Sheet + rapport email

Ce dossier contient les deux livrables prêts à brancher sur le workflow n8n qui reçoit déjà
l'événement `simulation.completed` (voir `AUTOMATION_WEBHOOK_URL` dans le README principal).

## 1. Google Sheet — log de chaque simulation

1. Crée un Google Sheet vide, renomme la première feuille (ex: `Simulations`).
2. Ouvre [`google-sheet-headers.csv`](./google-sheet-headers.csv), copie la ligne d'en-têtes,
   colle-la dans la cellule `A1` du Sheet (Google Sheets éclate automatiquement le CSV collé en
   colonnes).
3. Dans n8n, sur le nœud **Webhook** existant, ajoute un nœud **Google Sheets** (action
   `Append Row`) branché derrière, avec ce mapping (`payload` = corps de l'event reçu) :

   | Colonne Sheet              | Valeur (expression n8n)                              |
   |-----------------------------|-------------------------------------------------------|
   | Date                        | `{{ $now.format('yyyy-MM-dd') }}`                     |
   | Heure                       | `{{ $now.format('HH:mm') }}`                          |
   | Email lead                  | `{{ $json.body.payload.leadEmail }}`                  |
   | Actif                       | `{{ $json.body.payload.coin.name }}`                  |
   | Symbole                     | `{{ $json.body.payload.coin.symbol }}`                |
   | Fréquence                   | `{{ $json.body.payload.frequency }}`                  |
   | Début période                | `{{ $json.body.payload.startDate }}`                  |
   | Fin période                  | `{{ $json.body.payload.endDate }}`                    |
   | Montant investi (EUR)       | `{{ $json.body.payload.invested }}`                   |
   | Quantité acquise            | `{{ $json.body.payload.acquired }}`                   |
   | Prix moyen (EUR)            | `{{ $json.body.payload.avgPrice }}`                   |
   | Capital final (EUR)         | `{{ $json.body.payload.finalCapital }}`               |
   | Performance (%)             | `{{ $json.body.payload.performancePct }}`             |

## 2. Rapport email — toutes les simulations d'un lead

Le webhook ne transporte que la simulation qui vient de déclencher l'événement. Pour envoyer un
rapport listant *toutes* les simulations d'un lead, on relit son historique dans Supabase au
moment de l'event :

1. Après le nœud **Webhook**, ajoute un **IF** : condition `{{ $json.body.payload.leadEmail }}`
   n'est pas vide (on n'envoie un rapport que si l'utilisateur a renseigné son email — voir le
   champ ajouté dans le simulateur).
2. Branche **True** → nœud **Supabase** (action `Get All Rows`, table `simulations`, filtre
   `lead_email = {{ $json.body.payload.leadEmail }}`, tri `created_at` décroissant).
3. Puis un nœud **Code** (JavaScript) qui transforme les lignes en HTML de tableau :

   ```js
   const rows = $input.all()[0].json; // tableau de simulations Supabase
   const fmtEur = (n) => Number(n).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

   const rowsHtml = rows.map((r) => `
     <tr style="border-top:1px solid #232b45;color:#f4f6fb;">
       <td style="padding:10px 12px;">${r.created_at.slice(0, 10)}</td>
       <td style="padding:10px 12px;">${r.coin_symbol}</td>
       <td style="padding:10px 12px;">${r.frequency}</td>
       <td style="padding:10px 12px;text-align:right;">${fmtEur(r.invested)}</td>
       <td style="padding:10px 12px;text-align:right;color:#f5c542;">${fmtEur(r.final_capital)}</td>
       <td style="padding:10px 12px;text-align:right;color:${r.performance_pct >= 0 ? "#22c55e" : "#f04438"};">
         ${r.performance_pct >= 0 ? "+" : ""}${Number(r.performance_pct).toFixed(2)} %
       </td>
     </tr>`).join("");

   return [{ json: {
     leadEmail: $('Webhook').first().json.body.payload.leadEmail,
     totalSimulations: rows.length,
     rowsHtml,
   }}];
   ```

4. Termine par un nœud **Send Email** (SMTP, Gmail, ou un service comme Resend/Postmark) :
   - **To** : `{{ $json.leadEmail }}`
   - **Subject** : `Votre rapport de simulation crypto — S'investir`
   - **HTML** : coller le contenu de [`lead-report-email.html`](./lead-report-email.html)
     (les `{{ $json.… }}` qu'il contient sont résolus automatiquement par n8n).

## Pourquoi cette architecture

- Le webhook reste minimal et rapide (pas de logique de reporting côté Next.js) — toute
  l'orchestration (Sheet, lecture Supabase, mise en forme, email) vit dans n8n, là où elle doit
  être pour rester modifiable sans redéployer l'app.
- Le champ email est **opt-in** (bouton "Recevoir mon rapport par email" dans le simulateur) :
  pas de collecte silencieuse, conforme RGPD sur le principe du consentement explicite.
