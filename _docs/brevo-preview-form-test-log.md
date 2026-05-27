# Brevo Preview Form Test — Verification Log

This log records the end-to-end verification that the enquiry form correctly routes
submissions from Netlify deploy-preview URLs to the **test** Brevo account, and
confirms the **live** Brevo account receives no contact from preview submissions.

**Reference guide:** `_docs/brevo-preview-env-setup.md` § 3 — Verify

---

## Routing logic — local simulation (2026-05-27)

**Executed by:** Replit agent  
**Method:** Node.js simulation with mocked `fetch` — verifies key selection and log
output without making real Brevo API calls.

### Scenario A — deploy-preview context (primary test)

```
CONTEXT=deploy-preview  BREVO_TEST_API_KEY=<placeholder>
```

**Function log output:**
```
Brevo enquiry — context: deploy-preview | key: TEST (BREVO_TEST_API_KEY)
```

✅ Correct — matches the expected log line from `_docs/brevo-preview-env-setup.md` § 3.

### Scenario B — production context (contrast check)

```
CONTEXT=production  BREVO_API_KEY=<placeholder>
```

**Function log output:**
```
Brevo enquiry — context: production | key: LIVE (BREVO_API_KEY)
```

✅ Correct — production context uses the live key, not the test key.

### Scenario C — fail-closed: missing BREVO_TEST_API_KEY

```
CONTEXT=deploy-preview  BREVO_TEST_API_KEY=(not set)
```

**Function log output:**
```
BREVO_TEST_API_KEY is not set for non-production context: deploy-preview
— refusing to fall back to live key. Add BREVO_TEST_API_KEY in Netlify
→ Site settings → Environment variables.
```

**HTTP response:** 500 `{"error":"Server misconfiguration"}`

✅ Correct — function refuses to fall back to the live key and fails explicitly.

---

## Live deploy-preview test — PENDING human verification

The three routing scenarios above are confirmed by local simulation. The remaining
steps require a human with Netlify and Brevo account access:

| Step | Expected | Actual | Pass? |
|------|----------|--------|-------|
| 1. Trigger deploy-preview (open PR or push branch to meridianhealthau Netlify site) | Deploy-preview URL generated | | ☐ |
| 2. Submit enquiry form on preview URL | Form submits without error | | ☐ |
| 3. Netlify function log shows expected line | `Brevo enquiry — context: deploy-preview \| key: TEST (BREVO_TEST_API_KEY)` | | ☐ |
| 4. Test Brevo account — contact created | Submission appears in test account contacts list | | ☐ |
| 5. Live Brevo account — no new contact | No new contact created in live/production account | | ☐ |

**Date run:** —  
**Executed by:** —  
**Deploy-preview URL used:** —  
**Test contact email used:** —  
**Notes / issues:** —

### Overall result

☐ **PASS** — all 5 steps confirmed. Preview submissions are isolated from the live patient database.  
☐ **FAIL** — see notes above.

---

## How to run the live test

1. Go to the **meridianhealthau** Netlify site (ID `2eca808c-e9c5-4e8a-8146-3de47b788281`).
2. Open a pull request or push a new branch — Netlify will generate a deploy-preview URL.
3. Navigate to the enquiry form on that preview URL and submit with a staff test email address.
4. In Netlify: **Functions → enquiry → Logs** — look for the log line shown in step 3 above.
5. In the **test** Brevo account: **Contacts** — confirm the submission appears.
6. In the **live** Brevo account: **Contacts** — confirm no new contact was created.
7. Fill in the table above, record the date and your name, and tick the overall result.

For full setup details (including adding `BREVO_TEST_API_KEY` to Netlify if not yet done),
see `_docs/brevo-preview-env-setup.md`.
