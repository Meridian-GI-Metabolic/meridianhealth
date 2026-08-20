#!/usr/bin/env node
/**
 * brevo-push-referrer-campaign.js
 *
 * Creates a one-off Brevo email campaign to send the Meridian Health referrer
 * contact update to the referring clinicians/practices list.
 *
 * Prerequisites:
 *   - BREVO_API_KEY env var set
 *   - BREVO_LIST_ID env var set (the Brevo list ID for referring clinicians).
 *     Meridian Referrers is list 9 when this value is not supplied.
 *   - This machine's IP must be authorised in Brevo:
 *     https://app.brevo.com/security/authorised_ips
 *
 * Usage:
 *   BREVO_API_KEY=your_key BREVO_LIST_ID=9 node scripts/brevo-push-referrer-campaign.js
 *
 * The script will:
 *   1. Read the email-adapted HTML from _docs/meridian-referrer-contact-update-email.html
 *   2. POST a new campaign to Brevo in DRAFT state
 *   3. Print the campaign ID so you can review and send/schedule it in Brevo
 *
 * The campaign is created as a DRAFT. Review it at:
 *   https://app.brevo.com/campaigns/email
 * Then schedule or send it from the Brevo UI after review.
 */

const fs   = require('fs');
const path = require('path');

const API_KEY = process.env.BREVO_API_KEY;
const DEFAULT_REFERRER_LIST_ID = 9;
const LIST_ID = process.env.BREVO_LIST_ID
  ? parseInt(process.env.BREVO_LIST_ID, 10)
  : DEFAULT_REFERRER_LIST_ID;
const BASE_URL = 'https://api.brevo.com/v3';

if (!API_KEY) {
  console.error('ERROR: BREVO_API_KEY environment variable is not set.');
  process.exit(1);
}

if (!LIST_ID || isNaN(LIST_ID)) {
  console.error('ERROR: BREVO_LIST_ID must be a valid numeric Brevo list ID.');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

const CAMPAIGN_NAME    = 'MH — Meridian Health Referrer Contact Update';
const SUBJECT_LINE     = 'Your Meridian Health referral contacts';
const PREVIEW_TEXT     = 'Updated practice contacts, including Dr Ashraf Tokhi, with direct contact downloads.';
const SENDER_NAME      = 'Meridian Health';
const SENDER_EMAIL     = 'media@meridianhealth.com.au';
const REPLY_TO_EMAIL   = 'media@meridianhealth.com.au';

const HTML_FILE = path.join(__dirname, '..', '_docs', 'meridian-referrer-contact-update-email.html');

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\nMeridian Health | Referrer Contact Update Campaign Push');
  console.log('='.repeat(56));

  // Load HTML
  let htmlContent;
  try {
    htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
    console.log(`\n  HTML loaded: ${path.relative(process.cwd(), HTML_FILE)} (${htmlContent.length.toLocaleString()} chars)`);
  } catch (err) {
    console.error(`\nERROR: Could not read HTML file at ${HTML_FILE}`);
    console.error(err.message);
    process.exit(1);
  }

  // Build campaign payload
  const payload = {
    name:        CAMPAIGN_NAME,
    subject:     SUBJECT_LINE,
    previewText: PREVIEW_TEXT,
    sender: {
      name:  SENDER_NAME,
      email: SENDER_EMAIL,
    },
    replyTo:     REPLY_TO_EMAIL,
    htmlContent: htmlContent,
    recipients: {
      listIds: [LIST_ID],
    },
  };

  console.log(`\n  Campaign name:  ${CAMPAIGN_NAME}`);
  console.log(`  Subject:        ${SUBJECT_LINE}`);
  console.log(`  Sender:         ${SENDER_NAME} <${SENDER_EMAIL}>`);
  console.log(`  Recipient list: ID ${LIST_ID}`);
  console.log('\n  Creating campaign in Brevo...');

  const response = await fetch(`${BASE_URL}/emailCampaigns`, {
    method: 'POST',
    headers: {
      'api-key':      API_KEY,
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('\n  ERROR: Brevo API returned an error.');
    console.error(`  Status: ${response.status}`);
    console.error(`  Body:   ${JSON.stringify(data, null, 2)}`);
    process.exit(1);
  }

  const campaignId = data.id;

  console.log('\n' + '='.repeat(56));
  console.log(`  SUCCESS: Campaign created as DRAFT`);
  console.log(`  Campaign ID: ${campaignId}`);
  console.log('\n  Next steps:');
  console.log('  1. Open Brevo: https://app.brevo.com/campaigns/email');
  console.log(`  2. Find "${CAMPAIGN_NAME}"`);
  console.log('  3. Preview the email and send a test to yourself');
  console.log('  4. Schedule or send the campaign when ready');
  console.log('='.repeat(56) + '\n');
}

run().catch((err) => {
  console.error('\nUnhandled error:', err.message);
  process.exit(1);
});
