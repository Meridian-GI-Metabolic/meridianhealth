#!/usr/bin/env node
/**
 * brevo-verify-ip.js
 *
 * Checks whether the current machine's outbound IP is authorised in Brevo
 * and whether the BREVO_API_KEY can perform write operations.
 *
 * Run this script after adding the IP to the Brevo allowlist to confirm
 * that template API calls will succeed.
 *
 * Brevo authorised IPs:  https://app.brevo.com/security/authorised_ips
 *
 * Usage:
 *   node scripts/brevo-verify-ip.js
 *
 * Requires: BREVO_API_KEY environment variable
 *
 * As of 2025-05-25 the Replit egress IP was confirmed as: 34.24.136.180
 * (The task description listed 35.196.16.181 which was outdated.)
 * If this script reports a different IP, add that new IP to the allowlist.
 */

const API_KEY = process.env.BREVO_API_KEY;
const BASE_URL = 'https://api.brevo.com/v3';

async function getEgressIp() {
  const res = await fetch('https://api.ipify.org?format=json');
  const json = await res.json();
  return json.ip;
}

async function testBrevoRead() {
  const res = await fetch(`${BASE_URL}/smtp/templates?limit=1`, {
    headers: { 'api-key': API_KEY, 'accept': 'application/json' },
  });
  return { status: res.status, ok: res.ok };
}

async function testBrevoWrite() {
  const res = await fetch(`${BASE_URL}/smtp/templates`, {
    method: 'POST',
    headers: {
      'api-key': API_KEY,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({
      templateName: '__ip-verify-test-delete-me__',
      subject: 'IP verification test — safe to delete',
      htmlContent: '<p>IP verification test template. Safe to delete.</p>',
      sender: { name: 'Meridian System', email: 'noreply@meridianwellbeing.com.au' },
    }),
  });
  const body = await res.json().catch(() => null);

  if (res.ok && body && body.id) {
    await deleteTestTemplate(body.id);
  }

  return { status: res.status, ok: res.ok, body };
}

async function deleteTestTemplate(id) {
  await fetch(`${BASE_URL}/smtp/templates/${id}`, {
    method: 'DELETE',
    headers: { 'api-key': API_KEY },
  }).catch(() => {});
}

async function main() {
  if (!API_KEY) {
    console.error('ERROR: BREVO_API_KEY environment variable is not set.');
    process.exit(1);
  }

  console.log('=== Brevo IP Authorisation Verification ===\n');

  const ip = await getEgressIp().catch(() => 'unknown');
  console.log(`Current egress IP:  ${ip}`);
  console.log(`Brevo allowlist:    https://app.brevo.com/security/authorised_ips\n`);

  const readResult = await testBrevoRead();
  console.log(`Read  (GET /smtp/templates):  HTTP ${readResult.status}  ${readResult.ok ? '✓ OK' : '✗ FAILED'}`);

  const writeResult = await testBrevoWrite();
  console.log(`Write (POST /smtp/templates): HTTP ${writeResult.status}  ${writeResult.ok ? '✓ OK' : '✗ FAILED'}`);

  if (!writeResult.ok) {
    const msg = writeResult.body && writeResult.body.message ? writeResult.body.message : JSON.stringify(writeResult.body);
    console.log(`\nBrevo says: ${msg}`);
    console.log(`\n── ACTION REQUIRED ──────────────────────────────────────────`);
    console.log(`1. Log into https://app.brevo.com/security/authorised_ips`);
    console.log(`2. Add this IP address: ${ip}`);
    console.log(`3. Save and re-run this script to confirm write access.`);
    console.log(`─────────────────────────────────────────────────────────────`);
    process.exit(1);
  }

  console.log('\n✓ Write access confirmed. Brevo API template management is fully operational.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
