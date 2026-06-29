/**
 * Fire-and-forget event emitter for downstream automation (n8n, HubSpot,
 * Sheets, etc.). Posts a JSON payload to AUTOMATION_WEBHOOK_URL if set —
 * e.g. an n8n Webhook node that fans the event out to a CRM or a sheet.
 * No-ops silently when unconfigured, and never blocks or fails the request
 * that triggered it.
 */
export function emitAutomationEvent(event: string, payload: Record<string, unknown>) {
  const url = process.env.AUTOMATION_WEBHOOK_URL;
  if (!url) return;

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
  }).catch(() => {
    // Best-effort: a webhook outage should never break the simulator.
  });
}
