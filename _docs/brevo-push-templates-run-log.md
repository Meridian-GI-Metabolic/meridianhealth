# Brevo Template Push — Run Log

**Date:** 2026-05-27  
**Time:** 00:39 UTC  
**Executed by:** Replit agent (server IP 34.148.214.203, authorised in Brevo)  
**Script:** `scripts/brevo-push-templates.js`  
**Command:** `node scripts/brevo-push-templates.js`

---

## Script output

```
Fetching all Brevo templates…
Found 18 template(s) in Brevo.

  ✓ Updated: "MH — Email 03 — Re-Engagement (24hr)" (id 1)
  ✓ Updated: "MH — Email 04 — Consultation Overview (3 day)" (id 2)
  ✓ Updated: "MH — Email 05 — Pathway Overview (5 day)" (id 3)
  ✓ Updated: "MH — Pathway 10A — Email 1 — Sleeve Overview" (id 4)
  ✓ Updated: "MH — Pathway 10A — Email 2 — Sleeve Preparation" (id 5)
  ✓ Updated: "MH — Pathway 10A — Email 3 — Sleeve Long-Term" (id 6)
  ✓ Updated: "MH — Pathway 10B — Email 1 — Bypass Overview" (id 7)
  ✓ Updated: "MH — Pathway 10B — Email 2 — Bypass Preparation" (id 8)
  ✓ Updated: "MH — Pathway 10B — Email 3 — Bypass Long-Term" (id 9)
  ✓ Updated: "MH — Pathway 10C — Email 1 — Upper GI Overview" (id 10)
  ✓ Updated: "MH — Pathway 10C — Email 2 — Upper GI Options" (id 11)
  ✓ Updated: "MH — Pathway 10C — Email 3 — Upper GI Long-Term" (id 12)
  ✓ Updated: "MH — Pathway 10D — Email 1 — Metabolic Overview" (id 13)
  ✓ Updated: "MH — Pathway 10D — Email 2 — Metabolic Plan" (id 14)
  ✓ Updated: "MH — Pathway 10D — Email 3 — Metabolic Long-Term" (id 15)
  ✓ Updated: "MH — Pathway 10E — Email 1 — Revision Overview" (id 16)
  ✓ Updated: "MH — Pathway 10E — Email 2 — Revision Preparation" (id 17)
  ✓ Updated: "MH — Pathway 10E — Email 3 — Revision Long-Term" (id 18)

──────────────────────────────────────────
Templates updated:  18 / 18
```

**Result: 18 / 18 ✓ Updated — zero NOT FOUND errors**

---

## Spot-check (API read-back, 3 templates)

| Brevo ID | Template name | Subject line | Body (chars) | `{{ contact.FIRSTNAME }}` |
|---|---|---|---|---|
| 1 | MH — Email 03 — Re-Engagement (24hr) | Following your enquiry with Meridian Health | 1,675 | ✓ Present |
| 7 | MH — Pathway 10B — Email 1 — Bypass Overview | Your gastric bypass pathway — what to expect | 1,946 | ✓ Present |
| 13 | MH — Pathway 10D — Email 1 — Metabolic Overview | Your metabolic medicine pathway — what to expect | 1,951 | ✓ Present |

All three spot-checked templates: subject correct, body copy present, merge tags intact.

---

## Notes

- The Brevo account had no pre-existing stub templates at the time of first run.
  Templates were created via the Brevo UI / API prior to this update run so that
  the script's update-by-name logic could match them correctly.
- Sender used: `media@meridianhealth.com.au` (the verified sender in this account).
  `reception@meridianhealth.com.au` is not yet a verified Brevo sender.

---

## Next steps

See `_docs/brevo-stage-03-05-and-10-activation-checklist.html` for Phase B (activate
automations in Brevo UI) and Phase C (clinical sign-off for Stage 10).

**Do not activate Stage 10 automations until clinical sign-off (Phase C) is complete.**
