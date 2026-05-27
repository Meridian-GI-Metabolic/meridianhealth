# Running the Brevo Template Push Script Locally

Use this guide when the Replit server IP is not authorised in Brevo and you need to push the 18 email templates from your own machine.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 18 or later | `node --version` to check. Script uses built-in `fetch` — no npm install needed. |
| Brevo API key | Brevo → Settings → API keys. Use the master or a key with template write access. |
| Your machine's IP authorised in Brevo | Brevo → Settings → Security → Authorised IPs. Add your current public IP before running. |
| The project files | Clone or download the repo so you have `scripts/brevo-push-templates.js` locally. |

---

## Step-by-step

### 1 — Find your public IP

```
curl -s https://api.ipify.org
```

Copy this value.

### 2 — Authorise your IP in Brevo

1. Log into [app.brevo.com](https://app.brevo.com)
2. Go to **Settings → Security → Authorised IPs**
3. Click **Add an IP** and paste your IP from step 1
4. Save

### 3 — Confirm the 18 stub templates exist in Brevo

Go to **Email → Templates** and verify all 18 stub templates listed below exist with names that match **exactly** (case-sensitive). Create any missing stubs before running the script.

| Template name | Subject line |
|---|---|
| MH — Email 03 — Re-Engagement (24hr) | Following your enquiry with Meridian Health |
| MH — Email 04 — Consultation Overview (3 day) | What to expect from an initial consultation |
| MH — Email 05 — Pathway Overview (5 day) | Upper GI, Bariatric & Metabolic care pathways |
| MH — Pathway 10A — Email 1 — Sleeve Overview | Your sleeve gastrectomy pathway — what to expect |
| MH — Pathway 10A — Email 2 — Sleeve Preparation | Preparing for your procedure |
| MH — Pathway 10A — Email 3 — Sleeve Long-Term | Life after sleeve gastrectomy |
| MH — Pathway 10B — Email 1 — Bypass Overview | Your gastric bypass pathway — what to expect |
| MH — Pathway 10B — Email 2 — Bypass Preparation | Preparing for your procedure |
| MH — Pathway 10B — Email 3 — Bypass Long-Term | Recovery and long-term outcomes |
| MH — Pathway 10C — Email 1 — Upper GI Overview | Your Upper GI pathway — what happens next |
| MH — Pathway 10C — Email 2 — Upper GI Options | Understanding your treatment options |
| MH — Pathway 10C — Email 3 — Upper GI Long-Term | Long-term management of Upper GI conditions |
| MH — Pathway 10D — Email 1 — Metabolic Overview | Your metabolic medicine pathway — what to expect |
| MH — Pathway 10D — Email 2 — Metabolic Plan | Getting the most from your treatment plan |
| MH — Pathway 10D — Email 3 — Metabolic Long-Term | Long-term metabolic health — beyond the prescription |
| MH — Pathway 10E — Email 1 — Revision Overview | Your revision surgery pathway — what to expect |
| MH — Pathway 10E — Email 2 — Revision Preparation | Preparing for your revision procedure |
| MH — Pathway 10E — Email 3 — Revision Long-Term | Long-term care after revision surgery |

### 4 — Run the script

From the project root (where `scripts/` lives):

```bash
BREVO_API_KEY=your_key_here node scripts/brevo-push-templates.js
```

On Windows (Command Prompt):
```
set BREVO_API_KEY=your_key_here && node scripts/brevo-push-templates.js
```

On Windows (PowerShell):
```
$env:BREVO_API_KEY="your_key_here"; node scripts/brevo-push-templates.js
```

### 5 — Check the output

A successful run looks like:

```
Fetching all Brevo templates…
Found 42 template(s) in Brevo.

  ✓ Updated: "MH — Email 03 — Re-Engagement (24hr)" (id 12)
  ✓ Updated: "MH — Email 04 — Consultation Overview (3 day)" (id 13)
  … (18 lines total)

──────────────────────────────────────────
Templates updated:  18 / 18
```

**If you see `NOT FOUND` lines:** the stub template name in Brevo doesn't match exactly. Check for extra spaces, wrong capitalisation, or missing em-dashes. Fix the name in Brevo and re-run.

**If you get a 401 error:** your IP is not yet authorised. Confirm it in Brevo → Settings → Security → Authorised IPs and try again.

### 6 — Run the verification script

> **Checklist cross-reference:** this step corresponds to **step A4** in `brevo-activation-checklist.html`.

Instead of manual spot-checking, run the read-back script to confirm all 18 templates pushed correctly:

```bash
BREVO_API_KEY=your_key_here node scripts/brevo-verify-templates.js
```

The script fetches each template from Brevo by name and checks that the subject line matches the manifest and the body contains the clinic phone number. A successful run looks like:

```
=== Brevo Template Verification ===

Checking 18 templates against manifest…

  ✓ PASS         "MH — Email 03 — Re-Engagement (24hr)"
  ✓ PASS         "MH — Email 04 — Consultation Overview (3 day)"
  … (18 lines total)

──────────────────────────────────────────
Passed: 18 / 18
Failed: 0 / 18

✓ All 18 templates verified. Push completed successfully.
```

If any template fails, the script prints the specific mismatch and exits with a non-zero code. Re-run `brevo-push-templates.js` to correct content issues.

### 7 — Spot-check one template in Brevo (optional)

> **Checklist cross-reference:** this step corresponds to **step A5 (optional)** in `brevo-activation-checklist.html`.

As a final sanity check, open any one template in the Brevo editor and confirm:
- Body copy is present and formatted correctly
- `{{ contact.FIRSTNAME }}` merge tag is intact in the greeting

---

## After the script runs

Refer to `_docs/brevo-activation-checklist.html` for the full activation checklist (Phase B — activating the automations in the Brevo UI, and Phase C — clinical sign-off for Stage 10).

**Important:** Do not activate Stage 10 automations until the clinical sign-off in Phase C is complete.
