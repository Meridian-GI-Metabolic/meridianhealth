# Meridian Health — Brevo Automation Project

This repository contains email automation scripts and documentation for Meridian Health's Brevo CRM integration. It is an operational tooling project, not a public-facing web application.

## What's here

| Path | Purpose |
|---|---|
| `scripts/brevo-push-templates.js` | Pushes all 18 Stage 03–05 and Stage 10 email templates into Brevo via the API |
| `scripts/brevo-verify-ip.js` | Checks whether the current machine's IP is authorised in Brevo |
| `_docs/` | Activation checklists, copy decks, automation flow documents |

## Key constraint

The Brevo API requires all calling IPs to be whitelisted in **Brevo → Settings → Security → Authorised IPs**. The Replit server IP is not whitelisted, so `brevo-push-templates.js` must be run from a local machine. See `_docs/brevo-push-script-local-run.md` for step-by-step instructions.

## Running the template push script locally

```bash
BREVO_API_KEY=your_key node scripts/brevo-push-templates.js
```

Full instructions: `_docs/brevo-push-script-local-run.md`

## User preferences

- Documents follow Meridian Health brand conventions (Georgia serif headings, `#c2a55e` gold rule, `#201e11` body text).
- HTML documents in `_docs/` are designed for browser/print viewing and use inline styles only.
