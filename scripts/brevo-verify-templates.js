#!/usr/bin/env node
/**
 * brevo-verify-templates.js
 *
 * Reads back all 18 Stage 03–05 and Stage 10 email templates from Brevo
 * and confirms that each template's subject line and body content match
 * the expected values. Run this after brevo-push-templates.js to confirm
 * the push completed correctly without opening the Brevo UI.
 *
 * Prerequisites:
 *   - BREVO_API_KEY env var set
 *   - This machine's IP must be authorised in Brevo:
 *     https://app.brevo.com/security/authorised_ips
 *
 * Usage:
 *   BREVO_API_KEY=your_key node scripts/brevo-verify-templates.js
 *
 *   Or if key is already in environment:
 *   node scripts/brevo-verify-templates.js
 *
 * Checks performed per template:
 *   1. Template exists in Brevo (matched by exact name)
 *   2. Subject line matches the manifest
 *   3. htmlContent contains the clinic phone number: (03) 9416 4418
 */

const API_KEY = process.env.BREVO_API_KEY;
const BASE_URL = 'https://api.brevo.com/v3';

if (!API_KEY) {
  console.error('ERROR: BREVO_API_KEY environment variable is not set.');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION MANIFEST
// Must stay in sync with the TEMPLATES array in brevo-push-templates.js
// sentinel = a string that must appear in htmlContent (phone number is present
// in every template body and is a meaningful correctness signal)
// ─────────────────────────────────────────────────────────────────────────────

const SENTINEL = '(03) 9416 4418';

const MANIFEST = [
  // Stage 03–05: Enquiry Nurture
  {
    name: 'MH — Email 03 — Re-Engagement (24hr)',
    subject: 'Following your enquiry with Meridian Health',
  },
  {
    name: 'MH — Email 04 — Consultation Overview (3 day)',
    subject: 'What to expect from an initial consultation',
  },
  {
    name: 'MH — Email 05 — Pathway Overview (5 day)',
    subject: 'Upper GI, Bariatric & Metabolic care pathways',
  },
  // Stage 10A — Sleeve Gastrectomy
  {
    name: 'MH — Pathway 10A — Email 1 — Sleeve Overview',
    subject: 'Your sleeve gastrectomy pathway — what to expect',
  },
  {
    name: 'MH — Pathway 10A — Email 2 — Sleeve Preparation',
    subject: 'Preparing for your procedure',
  },
  {
    name: 'MH — Pathway 10A — Email 3 — Sleeve Long-Term',
    subject: 'Life after sleeve gastrectomy',
  },
  // Stage 10B — Gastric Bypass
  {
    name: 'MH — Pathway 10B — Email 1 — Bypass Overview',
    subject: 'Your gastric bypass pathway — what to expect',
  },
  {
    name: 'MH — Pathway 10B — Email 2 — Bypass Preparation',
    subject: 'Preparing for your procedure',
  },
  {
    name: 'MH — Pathway 10B — Email 3 — Bypass Long-Term',
    subject: 'Recovery and long-term outcomes',
  },
  // Stage 10C — Reflux & Upper GI
  {
    name: 'MH — Pathway 10C — Email 1 — Upper GI Overview',
    subject: 'Your Upper GI pathway — what happens next',
  },
  {
    name: 'MH — Pathway 10C — Email 2 — Upper GI Options',
    subject: 'Understanding your treatment options',
  },
  {
    name: 'MH — Pathway 10C — Email 3 — Upper GI Long-Term',
    subject: 'Long-term management of Upper GI conditions',
  },
  // Stage 10D — GLP-1 & Metabolic Medicine
  {
    name: 'MH — Pathway 10D — Email 1 — Metabolic Overview',
    subject: 'Your metabolic medicine pathway — what to expect',
  },
  {
    name: 'MH — Pathway 10D — Email 2 — Metabolic Plan',
    subject: 'Getting the most from your treatment plan',
  },
  {
    name: 'MH — Pathway 10D — Email 3 — Metabolic Long-Term',
    subject: 'Long-term metabolic health — beyond the prescription',
  },
  // Stage 10E — Revision Procedures
  {
    name: 'MH — Pathway 10E — Email 1 — Revision Overview',
    subject: 'Your revision surgery pathway — what to expect',
  },
  {
    name: 'MH — Pathway 10E — Email 2 — Revision Preparation',
    subject: 'Preparing for your revision procedure',
  },
  {
    name: 'MH — Pathway 10E — Email 3 — Revision Long-Term',
    subject: 'Long-term care after revision surgery',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function brevoGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { accept: 'application/json', 'api-key': API_KEY },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GET ${path} → ${res.status}: ${err}`);
  }
  return res.json();
}

async function getAllTemplates() {
  const results = [];
  let offset = 0;
  const limit = 50;
  while (true) {
    const data = await brevoGet(`/smtp/templates?limit=${limit}&offset=${offset}`);
    const batch = data.templates || [];
    results.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return results;
}

async function getTemplateDetail(id) {
  return brevoGet(`/smtp/templates/${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Brevo Template Verification ===\n');
  console.log(`Checking ${MANIFEST.length} templates against manifest…\n`);

  const allTemplates = await getAllTemplates();
  const byName = {};
  for (const t of allTemplates) {
    byName[t.name] = t;
  }

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const entry of MANIFEST) {
    const stub = byName[entry.name];

    if (!stub) {
      console.log(`  ✗ NOT FOUND    "${entry.name}"`);
      failed++;
      failures.push({ name: entry.name, reason: 'Template not found in Brevo' });
      continue;
    }

    let detail;
    try {
      detail = await getTemplateDetail(stub.id);
    } catch (err) {
      console.log(`  ✗ FETCH ERROR  "${entry.name}" — ${err.message}`);
      failed++;
      failures.push({ name: entry.name, reason: `Could not fetch template detail: ${err.message}` });
      continue;
    }

    const issues = [];

    if (detail.subject !== entry.subject) {
      issues.push(`subject mismatch — expected "${entry.subject}", got "${detail.subject}"`);
    }

    const html = detail.htmlContent || '';
    if (!html.includes(SENTINEL)) {
      issues.push(`htmlContent does not contain sentinel "${SENTINEL}"`);
    }

    if (issues.length === 0) {
      console.log(`  ✓ PASS         "${entry.name}"`);
      passed++;
    } else {
      console.log(`  ✗ FAIL         "${entry.name}"`);
      for (const issue of issues) {
        console.log(`                   → ${issue}`);
      }
      failed++;
      failures.push({ name: entry.name, reason: issues.join('; ') });
    }
  }

  console.log(`\n──────────────────────────────────────────`);
  console.log(`Passed: ${passed} / ${MANIFEST.length}`);
  console.log(`Failed: ${failed} / ${MANIFEST.length}`);

  if (failures.length > 0) {
    console.log(`\nFailed templates:`);
    for (const f of failures) {
      console.log(`  • "${f.name}"`);
      console.log(`    ${f.reason}`);
    }
    console.log(`\nRe-run brevo-push-templates.js to fix content issues,`);
    console.log(`or create missing stub templates in Brevo and re-push.`);
    console.log(`See _docs/brevo-push-script-local-run.md for full instructions.`);
    process.exit(1);
  }

  console.log(`\n✓ All ${MANIFEST.length} templates verified. Push completed successfully.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
