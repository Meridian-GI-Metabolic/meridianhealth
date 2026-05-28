---
name: Stage 10 sequence configuration
description: Brevo automation specs for the 5 Stage 10 procedure tracks — saved as draft, not active. Activation gate and sign-off requirements.
---

# Stage 10 — Automation Sequence Configuration

## Status
Saved as procedure-based sequences. NOT ACTIVE in Brevo.
Do not activate until clinical sign-off is complete.

## Five tracks

| Track | Automation Name | pathway attribute value | Timing |
|-------|----------------|------------------------|--------|
| 10A Sleeve | MH — Pathway: Sleeve Gastrectomy | `sleeve` | Immediate, +3d, +7d |
| 10B Bypass | MH — Pathway: Gastric Bypass | `bypass` | Immediate, +3d, +7d |
| 10C Upper GI | MH — Pathway: Reflux & Upper GI | `reflux_uppergi` | Immediate, +4d, +10d |
| 10D Metabolic | MH — Pathway: Metabolic Medicine | `glp1_metabolic` | Immediate, +4d, +10d |
| 10E Revision | MH — Pathway: Revision Procedures | `revision` | Immediate, +4d, +10d |

## Activation gate (all must be met)
1. All 15 templates pushed to Brevo and verified
2. Clinical review completed — `_docs/stage-10-clinical-signoff-checklist.html`
3. Any amendments applied to push script + email review doc
4. Sign-off signed by Kathleen Twentyman (Director of Brand & Marketing)
5. Signed PDF filed and reference recorded in setup checklist

## Files
- Sequence config doc: `_docs/brevo-stage-10-sequence-config.html`
- Email copy / push script: `scripts/brevo-push-templates.js`
- Sign-off checklist: `_docs/stage-10-clinical-signoff-checklist.html`
- Setup checklist: `_docs/brevo-stage-10-setup-checklist.html`
