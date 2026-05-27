# Brevo test key — preview & branch deploy setup

## Why this exists

All Netlify contexts (production, deploy-preview, branch-deploy, dev) share the
same environment variables by default. Without a separate test key, any enquiry
form submission made from a preview URL would create a real contact in the live
Brevo account and could trigger live patient automation sequences.

`netlify/functions/enquiry.js` checks Netlify's built-in `CONTEXT` environment
variable and automatically uses `BREVO_TEST_API_KEY` for every non-production
context. The production context continues to use `BREVO_API_KEY`.

| Netlify context  | Key used              |
|------------------|-----------------------|
| `production`     | `BREVO_API_KEY`       |
| `deploy-preview` | `BREVO_TEST_API_KEY`  |
| `branch-deploy`  | `BREVO_TEST_API_KEY`  |
| `dev`            | `BREVO_TEST_API_KEY`  |

If `BREVO_TEST_API_KEY` is not set in a non-production context, the function
refuses the request, logs an error, and returns HTTP 500. It never falls back
to the live key — see [Fail-closed behaviour](#fail-closed-behaviour) below.

---

## One-time setup steps

### 1. Create a Brevo test account

1. Go to [brevo.com](https://www.brevo.com) and register a new free account
   using an address such as `tech+brevo-test@meridianhealthau.com.au`.
2. Generate an API key: **Settings → API Keys → Generate a new API key**.
   Name it `meridian-preview-test`.
3. Copy the key — you will not be able to see it again.

### 2. Add BREVO_TEST_API_KEY to Netlify

1. Open the Netlify dashboard → **meridianhealthau** site
   (ID `2eca808c-e9c5-4e8a-8146-3de47b788281`).
2. Go to **Site configuration → Environment variables → Add a variable**.
3. Key: `BREVO_TEST_API_KEY`
4. Value: paste the key from step 1.
5. Scopes: leave as **All scopes** (the production context won't use it, but
   it causes no harm being present there).
6. Click **Save**.

### 3. Verify

1. Trigger a deploy-preview (open a pull request or push a branch).
2. Submit the enquiry form on the preview URL.
3. Check the Netlify function log — you should see:
   ```
   Brevo enquiry — context: deploy-preview | key: TEST (BREVO_TEST_API_KEY)
   ```
4. Confirm the submission appears in the **test** Brevo account's contacts, not
   the production account.

---

## Fail-closed behaviour

If `BREVO_TEST_API_KEY` is missing in a preview context, the function logs:

```
BREVO_TEST_API_KEY is not set for non-production context: deploy-preview
— refusing to fall back to live key. Add BREVO_TEST_API_KEY in Netlify
→ Site settings → Environment variables.
```

and returns HTTP 500 to the form. It **never** falls back to the live key in a
non-production context — the failure is explicit rather than silent. This means
the enquiry form will be broken on preview deploys until `BREVO_TEST_API_KEY` is
added to Netlify (follow-up task #37).
