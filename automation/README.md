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
   const rows = $input.all().map((item) => item.json); // une ligne Supabase par item

   const fmtEur = (n) => Number(n).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
   const fmtDate = (iso) => new Date(iso).toLocaleDateString("fr-FR");
   const FREQUENCY_LABELS = {
     once: "Investissement unique",
     daily: "Par jour",
     weekly: "Par semaine",
     monthly: "Par mois",
   };

   const rowsHtml = rows
     .map((r, i) => {
       const positive = r.performance_pct >= 0;
       const bg = i % 2 === 0 ? "#131a30" : "#10162a";
       const badgeBg = positive ? "#0d2818" : "#2d1416";
       const badgeColor = positive ? "#22c55e" : "#f04438";
       return (
         `<tr style="background:${bg};border-top:1px solid #232b45;color:#f4f6fb;font-size:13px;">` +
         `<td style="padding:12px 14px;white-space:nowrap;">${fmtDate(r.created_at)}</td>` +
         `<td style="padding:12px 14px;font-weight:600;">${r.coin_symbol}</td>` +
         `<td style="padding:12px 14px;color:#8893ab;">${FREQUENCY_LABELS[r.frequency] || r.frequency}</td>` +
         `<td style="padding:12px 14px;text-align:right;">${fmtEur(r.invested)}</td>` +
         `<td style="padding:12px 14px;text-align:right;color:#f5c542;font-weight:600;">${fmtEur(r.final_capital)}</td>` +
         `<td style="padding:12px 14px;text-align:right;">` +
         `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${badgeBg};color:${badgeColor};font-weight:600;font-size:12px;">` +
         `${positive ? "+" : ""}${Number(r.performance_pct).toFixed(2)} %` +
         `</span></td>` +
         `</tr>`
       );
     })
     .join("");

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
