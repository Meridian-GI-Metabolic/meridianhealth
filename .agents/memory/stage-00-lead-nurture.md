---
name: Stage 00 Instagram/website lead nurture
description: Design decisions, AHPRA rules, Everlab funnel reference, and Brevo configuration for the pre-consultation social lead nurture sequence.
---

# Stage 00 — Instagram & Website Lead Nurture

## Key decisions

**Automation name in Brevo:** MH — Social Lead Nurture (Stage 00)

**Entry triggers:** tag `source_instagram` OR tag `source_website_subscribe`

**Exit condition:** tag `booked_consult` applied (same as Stages 01–05)

**Sequence:** 4 emails + 1 SMS over 5 days
- 00-01: Immediate email — welcome / what MERIDIAN is
- 00-02: +15 min SMS — warm team follow-up (no named individual)
- 00-03: +24 hr email — clinical credibility / Australian prevalence stats
- 00-04: +3 day email — demystify the consultation
- 00-05: +5 day email — three clinical pathways overview

**Why no further follow-ups after 00-05:** Deliberately bounded. A lead that has received 5 touchpoints without booking should enter a separate re-engagement campaign, not extended automation.

## AHPRA compliance rules (must not be altered)
- No testimonials or patient stories
- No outcome claims — stats are prevalence data only (AIHW / GESA cited in Email 00-03)
- No urgency or scarcity language
- No before/after language
- No fear-based messaging
- No AI references in copy
- Data source footnote in Email 00-03 must be retained

## Everlab funnel reference (May 2026 Excel)
Everlab's structure: immediate SMS + email confirmation + mission email → T-24h attendance SMS → T-60min email+SMS → T-15min humanise SMS → post-call SMS + email follow-up.
MERIDIAN adapted: structure only — Everlab's urgency tactics ("limited slots", named sales rep pressure) excluded as AHPRA non-compliant and brand misaligned.

## Files
- Copy deck: `_docs/brevo-stage-00-instagram-lead-nurture.html`
- Push script: `scripts/brevo-push-templates.js` (body00_01, body00_03, body00_04, body00_05)
- Brevo template names: `MH — Email 00-01/03/04/05 — Social *(Immediate|24hr|3 day|5 day)*`
- SMS 00-02 configured directly in Brevo SMS (not a push-script template)
