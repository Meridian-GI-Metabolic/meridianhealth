#!/usr/bin/env node
/**
 * brevo-push-templates.js
 *
 * Pushes all Stage 00 (Instagram/website lead nurture), Stage 03–05, and Stage 10
 * email template copy into Brevo. Matches templates by name, updates htmlContent and subject.
 *
 * Prerequisites:
 *   - BREVO_API_KEY env var set
 *   - This machine's IP must be authorised in Brevo:
 *     https://app.brevo.com/security/authorised_ips
 *
 * Usage:
 *   BREVO_API_KEY=your_key node scripts/brevo-push-templates.js
 *
 *   Or if key is already in environment:
 *   node scripts/brevo-push-templates.js
 *
 * The script will:
 *   1. Fetch all templates from Brevo
 *   2. Match each template by name
 *   3. Update htmlContent and subject for each matched template
 *   4. Report success / failure per template
 *
 * Stage 00 templates: social/website lead nurture (Instagram + website subscribe).
 *   Automation name in Brevo: MH — Social Lead Nurture (Stage 00)
 *   AHPRA-compliant copy — do not alter compliance elements without legal review.
 *
 * Stage 10 templates: script updates copy only.
 * DO NOT activate Stage 10 automations until clinical sign-off is complete.
 * See _docs/brevo-stage-10-sequence-config.html and _docs/stage-10-clinical-signoff-checklist.html
 */

const API_KEY = process.env.BREVO_API_KEY;
const BASE_URL = 'https://api.brevo.com/v3';

if (!API_KEY) {
  console.error('ERROR: BREVO_API_KEY environment variable is not set.');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATE DEFINITIONS
// key = exact Brevo template name
// subject = email subject line
// html = full HTML email body (Brevo wraps this in its own sending shell)
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_WRAPPER = (bodyHtml) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin: 0; padding: 0; background: #f5f3ef; font-family: Georgia, 'Times New Roman', serif; }
  .outer { background: #f5f3ef; padding: 32px 16px; }
  .card  { background: #ffffff; max-width: 560px; margin: 0 auto; padding: 40px 40px 32px; border-top: 3px solid #c2a55e; }
  p { font-size: 15px; line-height: 1.7; color: #201e11; margin: 0 0 14px; }
  .footer { max-width: 560px; margin: 0 auto; padding: 16px 0 0; font-size: 12px; color: #aaa; line-height: 1.6; }
</style>
</head>
<body>
<div class="outer">
  <div class="card">
${bodyHtml}
  </div>
  <div class="footer">
    MERIDIAN Health &nbsp;·&nbsp; Suite 301, Level 3, 33 Victoria Parade, Fitzroy VIC 3065<br/>
    (03) 9416 4418 &nbsp;·&nbsp; reception@meridianhealth.com.au<br/>
    <a href="{{unsubscribeLink}}" style="color:#aaa;">Unsubscribe</a>
  </div>
</div>
</body>
</html>`;

const body03 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>We wanted to follow up on your recent enquiry with MERIDIAN Health.</p>
    <p>We understand that taking the first step toward specialist care can feel significant — and that the timing may not always feel right.</p>
    <p>If you have questions before booking, or would simply like to understand more about what an initial consultation involves, our team is happy to help.</p>
    <p>You are welcome to contact us on <strong>(03) 9416 4418</strong> or reply to this email.</p>
    <p>There is no obligation. We are here when you are ready.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body04 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Many patients tell us that not knowing what to expect is one of the things that delays them from booking.</p>
    <p>An initial consultation at MERIDIAN is a conversation — not a commitment.</p>
    <p>Your clinician will review your medical history, current concerns and treatment goals. There is time to ask questions, and no obligation to proceed with any particular pathway.</p>
    <p>Consultations are available face-to-face at our Fitzroy clinic, or via telehealth through Coviu — from wherever you are most comfortable.</p>
    <p>By the end of your first appointment, you will have a clearer picture of your options and what a care plan might look like for you.</p>
    <p>To arrange a consultation, call us on <strong>(03) 9416 4418</strong> or reply to this email.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body05 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>MERIDIAN Health provides specialist care across three clinical pathways — each distinct, each serving a different clinical need.</p>
    <p><strong>Upper GI &amp; Surgical Care</strong> covers conditions including reflux, hiatus hernia, oesophageal disease and gallbladder concerns. These are managed by Upper GI surgeons within a multidisciplinary team.</p>
    <p><strong>Bariatric Surgery</strong> includes sleeve gastrectomy, gastric bypass, revision procedures and sleeve fundoplication — integrated with physician-led metabolic medicine, dietetics and twelve months of structured follow-up.</p>
    <p><strong>Metabolic Medicine</strong> offers clinician-guided medical weight management, including GLP-1 therapy where clinically appropriate, alongside structured investigations, dietitian input and long-term review.</p>
    <p>Different pathways exist because different patients exist.</p>
    <p>A first consultation is where your pathway becomes clear. If you are ready to take that step — or have questions before you do — our team is here.</p>
    <p>Call us on <strong>(03) 9416 4418</strong>, or reply to this email.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

// ── 10A Sleeve Gastrectomy ──────────────────────────────────────────────────

const body10A1 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Thank you for attending your initial consultation with the MERIDIAN team. Following your appointment, your clinician has recommended the sleeve gastrectomy pathway as the appropriate next step in your care.</p>
    <p>Sleeve gastrectomy is a laparoscopic procedure that reduces stomach volume and influences appetite signalling pathways associated with hunger and satiety. At MERIDIAN, surgery is delivered within a broader multidisciplinary care pathway.</p>
    <p>In the coming days, your care coordinator will be in touch to outline your pre-operative timeline. If you have any questions in the meantime, please contact the clinic on <strong>(03) 9416 4418</strong> or reply to this email.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body10A2 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Preparation for sleeve gastrectomy begins before your procedure date.</p>
    <p>In the weeks leading up to surgery, your care team will guide you through a two-week Very Low Calorie Diet (VLCD) liver reduction program. This reduces liver size, which may assist surgical access during the procedure.</p>
    <p>You will also meet with your nurse and dietitian to cover surgical education, supplement planning, eating progression after surgery and what to expect in the days immediately following your procedure.</p>
    <p>Pre-operative preparation assists patients in understanding the recovery process and post-operative dietary progression.</p>
    <p>Your care team will be in contact to confirm your pre-operative appointments. In the meantime, please don't hesitate to call us on <strong>(03) 9416 4418</strong>.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body10A3 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>The period following sleeve gastrectomy is an important part of your ongoing care pathway.</p>
    <p>At MERIDIAN, twelve months of follow-up are included as part of your surgical pathway. This involves planned appointments with your surgeon, nurse and dietitian, focused on diet progression, nutritional monitoring, supplement optimisation and metabolic health review.</p>
    <p>Most patients return to light daily activity within two weeks of surgery. Your team will provide milestone guidance at each stage of your recovery.</p>
    <p>Beyond the first year, many patients choose to continue long-term care with the MERIDIAN team. Ongoing follow-up supports nutritional monitoring and long-term metabolic review.</p>
    <p>We are here throughout the process. Please contact us on <strong>(03) 9416 4418</strong> if you have any questions before your next appointment.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

// ── 10B Gastric Bypass ──────────────────────────────────────────────────────

const body10B1 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Thank you for attending your consultation with the MERIDIAN team. Your clinician has recommended the gastric bypass pathway as the most appropriate next step for your care.</p>
    <p>Gastric bypass is a well-established bariatric procedure combining restriction with selective changes to nutrient absorption. It is often considered in patients with significant reflux, type 2 diabetes or where previous weight management approaches have not achieved the intended clinical outcome.</p>
    <p>Your care pathway at MERIDIAN will involve preparation, surgery and a structured twelve-month follow-up period. Each stage is supported by the same team throughout.</p>
    <p>Your care coordinator will be in contact shortly to outline your pre-operative timeline. Questions in the meantime? Call us on <strong>(03) 9416 4418</strong>.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body10B2 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Preparation forms an important part of your bypass pathway.</p>
    <p>In the weeks prior to surgery, you will complete a two-week VLCD liver reduction program, attend a pre-operative nurse education session, and meet with your dietitian to begin planning your supplement protocol and post-operative eating progression.</p>
    <p>Gastric bypass involves changes to how your digestive system processes nutrients. For this reason, a lifelong supplement regimen — typically including B12, iron, calcium and other vitamins — will be part of your care plan from the outset. Your dietitian will tailor this to your needs.</p>
    <p>Pre-operative preparation assists patients in understanding recovery and post-operative nutritional requirements. Your care team will confirm your pre-operative appointments shortly. In the meantime, please contact us on <strong>(03) 9416 4418</strong> with any questions.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body10B3 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Recovery from gastric bypass occurs in stages and involves ongoing follow-up with your care team.</p>
    <p>Most patients return to light daily activity within two to three weeks of surgery. Your dietitian will guide your eating progression through liquid, pureed and soft food stages before transitioning to a regular, nutrient-dense diet. Supplement adherence during this period is important for your long-term nutritional health.</p>
    <p>At MERIDIAN, twelve months of structured follow-up are included as part of your surgical pathway — with ongoing access to your surgeon, nurse and dietitian. Beyond this period, longer-term metabolic and nutritional review is recommended as part of ongoing nutritional and metabolic monitoring.</p>
    <p>If you have questions between appointments, please contact the clinic on <strong>(03) 9416 4418</strong> or reply to this email.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

// ── 10C Reflux & Upper GI ───────────────────────────────────────────────────

const body10C1 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Thank you for your consultation with the MERIDIAN team. Your clinician has recommended an Upper GI care pathway for further assessment and management.</p>
    <p>MERIDIAN's Upper GI service manages a range of conditions including reflux, hiatus hernia, oesophageal disease, Barrett's oesophagus and related gastric concerns. Your care will be led by specialist Upper GI surgeons within a multidisciplinary team.</p>
    <p>Depending on your condition, your pathway may involve further investigations — such as oesophageal physiology testing, gastroscopy or imaging — before a treatment plan is confirmed.</p>
    <p>Your care coordinator will be in contact to outline your specific next steps. If you have questions in the meantime, please call us on <strong>(03) 9416 4418</strong> or reply to this email.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body10C2 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Upper GI conditions are managed using a range of medical and surgical approaches — from optimised medical therapy through to surgical intervention. The right approach depends on your symptoms, physiology, anatomy and how you have responded to previous treatment.</p>
    <p>For conditions such as reflux and hiatus hernia, anti-reflux surgery — including fundoplication — is a well-established surgical option when symptoms are not adequately controlled with medication. Your surgeon will discuss the evidence and what is most appropriate for your situation.</p>
    <p>For more complex oesophageal and gastric conditions, further investigation is typically required before a treatment plan is finalised.</p>
    <p>Your team will walk you through your specific options at your next appointment. If anything is unclear before then, please contact us on <strong>(03) 9416 4418</strong>.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body10C3 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Many Upper GI conditions are chronic — and often require ongoing review over time.</p>
    <p>Whether your pathway involves surgery, ongoing medical management or structured monitoring, the MERIDIAN team remains involved throughout. This includes follow-up with your specialist, access to nursing support and coordination with other members of your care team where required.</p>
    <p>For conditions such as Barrett's oesophagus, long-term surveillance is an important part of your care plan. Your clinician will advise on the appropriate interval and approach for your situation.</p>
    <p>We are here to support you at every stage. Please do not hesitate to contact us on <strong>(03) 9416 4418</strong> or reply to this email with any questions.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

// ── 10D GLP-1 & Metabolic Medicine ─────────────────────────────────────────

const body10D1 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Thank you for your consultation with the MERIDIAN team. Your clinician has recommended a metabolic medicine pathway as the appropriate approach for your care.</p>
    <p>Metabolic medicine at MERIDIAN is physician-led and structured around your individual health profile and broader clinical assessment. Where GLP-1 therapy is clinically appropriate, it will be part of a broader care plan that includes structured investigations, dietitian input and regular clinical review.</p>
    <p>Metabolic health management often involves multiple components including nutrition, physical activity, behavioural support and medical review. Your plan is designed to support ongoing metabolic health management with the right clinical oversight throughout.</p>
    <p>Your care coordinator will be in touch to confirm your next appointment. Questions in the meantime? Call us on <strong>(03) 9416 4418</strong>.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body10D2 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Metabolic medicine pathways generally involve multiple components delivered together over time.</p>
    <p>Alongside any prescribed therapy, your care plan will typically include regular dietitian review — focusing on nutrition quality, eating patterns and the preservation of lean muscle mass. Maintenance of lean muscle mass is an important consideration during weight reduction treatment, and your team will support this from the outset.</p>
    <p>Structured blood tests and body composition assessments will help your physician track what is working and adjust your plan over time.</p>
    <p>If you have questions about your plan or your progress at any stage, please contact us on <strong>(03) 9416 4418</strong> or reply to this email.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body10D3 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Metabolic health management typically involves ongoing clinical review over time.</p>
    <p>At MERIDIAN, your physician will continue to review your metabolic markers, medication plan and overall health trajectory at scheduled intervals. As your health changes, your plan can be adjusted — this may involve changes to medication, nutritional goals, or a conversation about additional pathways where appropriate.</p>
    <p>Many patients on GLP-1 therapy find that their needs evolve over time. Having a structured clinical relationship means those changes are reviewed and adjusted with ongoing clinical oversight.</p>
    <p>We are here to support your health over the long term. Please contact us on <strong>(03) 9416 4418</strong> or reply to this email with any questions.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

// ── 10E Revision Procedures ─────────────────────────────────────────────────

const body10E1 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Thank you for your consultation with the MERIDIAN team. Your clinician has recommended a revision surgery pathway as the appropriate next step in your care.</p>
    <p>Revision bariatric surgery addresses the outcomes of a previous procedure — whether that involves weight regain, reflux, nutritional concerns, anatomical changes or another clinical consideration. It is a complex area requiring detailed assessment and multidisciplinary review.</p>
    <p>Revision pathways are individualised and developed according to your previous procedure, anatomy and clinical history.</p>
    <p>Your care coordinator will be in contact to outline your pre-operative timeline and next steps. In the meantime, please contact us on <strong>(03) 9416 4418</strong> or reply to this email.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body10E2 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Revision surgery often requires additional assessment and planning prior to surgery.</p>
    <p>Before your procedure, your care team will arrange a detailed multidisciplinary assessment, including surgical review, dietitian consultation, relevant investigations and where appropriate, psychological assessment. Understanding the anatomy and outcomes of your previous procedure is central to this process.</p>
    <p>Pre-operative preparation will also include a liver reduction diet, nurse education and a structured discussion about what to expect in recovery. Your team will walk you through each stage.</p>
    <p>This preparation process assists surgical planning and post-operative care. Please contact us on <strong>(03) 9416 4418</strong> if you have any questions before your pre-operative appointments.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body10E3 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Recovery and follow-up after revision surgery requires structured post-operative follow-up and ongoing clinical review.</p>
    <p>At MERIDIAN, your post-operative care will involve planned appointments with your surgeon, nurse and dietitian throughout the first twelve months. Nutritional monitoring, supplement review and metabolic assessment are central to this period.</p>
    <p>For many revision patients, long-term follow-up extends well beyond the first year. Ongoing clinical review supports ongoing nutritional and metabolic monitoring over time.</p>
    <p>Your MERIDIAN team remains your care team. Please contact us on <strong>(03) 9416 4418</strong> or reply to this email at any stage.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

// ── Stage 00 — Instagram / Website Lead Nurture ─────────────────────────────
// Automation: MH — Social Lead Nurture (Stage 00)
// Entry triggers: tag source_instagram OR tag source_website_subscribe
// Exit condition: tag booked_consult applied
// AHPRA-compliant — do not alter compliance language without review.
// Full copy reference: _docs/brevo-stage-00-instagram-lead-nurture.html

const body00_01 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>Thank you for reaching out.</p>
    <p>MERIDIAN is a specialist medical practice providing care across three clinical areas: upper gastrointestinal and surgical care, bariatric surgery, and physician-led metabolic medicine.</p>
    <p>Our clinical team includes upper GI surgeons, bariatric surgeons, a metabolic medicine physician, specialist nurses and a registered dietitian — working together in one practice, from your first consultation through to your ongoing care.</p>
    <p>If you are exploring care for a specific condition, or are at the stage of understanding your options, an initial consultation is the right starting point. It is a clinical conversation, not a commitment.</p>
    <p>A member of our team will be in touch shortly. In the meantime, if you have a question or would like to arrange a consultation, we are available on <strong>(03) 9416 4418</strong> or by replying to this email.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body00_03 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>The conditions we see at MERIDIAN are more common than many patients realise when they first reach out.</p>
    <p>Obesity affects approximately one in three Australian adults — a significant proportion of whom meet clinical criteria for structured medical or surgical management. Gastro-oesophageal reflux disease affects an estimated 10–15% of the population, and is frequently undertreated or managed with medication alone when other options exist. Conditions including type 2 diabetes, metabolic syndrome and non-alcoholic fatty liver disease are increasingly prevalent, with strong evidence supporting structured specialist management.</p>
    <p>What distinguishes specialist care from general practice is not simply the range of procedures available. It is the depth of assessment, the integration of multiple disciplines — surgeons, physicians, nurses, dietitians — and the continuity of clinical management over time.</p>
    <p>At MERIDIAN, every patient pathway begins with a thorough initial consultation. No pathway is recommended before a full clinical assessment. No treatment is prescribed before your history, investigations and goals are understood.</p>
    <p>If you are at the stage of exploring what specialist care might look like for your situation, we are here to help — without obligation and without pressure.</p>
    <p>Call <strong>(03) 9416 4418</strong> or reply to this email.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>
    <p style="font-size:11px; color:#aaa; margin-top:18px;">Data sources: Australian Institute of Health and Welfare, <em>Overweight and obesity</em>, 2023; Gastroenterological Society of Australia, <em>GORD clinical practice guidelines</em>.</p>`;

const body00_04 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>One of the things that can delay people from seeking specialist care is simply not knowing what an appointment involves.</p>
    <p>At MERIDIAN, a first consultation is a clinical conversation. Your clinician will review your medical history, any relevant investigations to date, current symptoms or concerns, and your goals — before any pathway or treatment is discussed.</p>
    <p>By the end of the appointment, you will have a clearer picture of:</p>
    <ul>
      <li>Whether specialist care is appropriate for your situation</li>
      <li>Which pathway, if any, is relevant to you</li>
      <li>What any recommended next steps would involve</li>
      <li>What care at MERIDIAN would look like, should you choose to proceed</li>
    </ul>
    <p>There is no obligation at the first appointment. No decision is required before you have had all your questions answered.</p>
    <p>Consultations are available face-to-face at our Fitzroy clinic, or via telehealth through Coviu — from wherever is most convenient for you.</p>
    <p>To arrange a time, call <strong>(03) 9416 4418</strong> or reply to this email.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

const body00_05 = `
    <p>Hi {{ contact.FIRSTNAME }},</p>
    <p>MERIDIAN provides specialist care across three distinct clinical areas — each with its own team, structure and management approach.</p>
    <p><strong>Upper GI &amp; Surgical Care</strong><br/>
    For conditions affecting the upper gastrointestinal system — including gastro-oesophageal reflux disease, hiatus hernia, Barrett's oesophagus, oesophageal and gastric conditions, and gallbladder disease. Managed by upper GI surgeons, with access to specialist investigations and a multidisciplinary clinical team.</p>
    <p><strong>Bariatric Surgery</strong><br/>
    Sleeve gastrectomy, gastric bypass, revision procedures and sleeve fundoplication — delivered within a coordinated care pathway including dietitian review, nurse education, pre-operative preparation, surgery and twelve months of structured follow-up.</p>
    <p><strong>Metabolic Medicine</strong><br/>
    Physician-led management of obesity, metabolic syndrome and related conditions — including GLP-1 therapy where clinically appropriate — alongside structured investigations, dietitian support and a long-term review framework. For patients whose needs are best addressed through medical rather than, or in addition to, surgical management.</p>
    <p>A first consultation is where your pathway becomes clear. Different conditions require different approaches — and that is where the assessment begins.</p>
    <p>If you are ready to take that step, or have questions before you do, we would be glad to hear from you.</p>
    <p>Call <strong>(03) 9416 4418</strong>, or reply to this email.</p>
    <p>Kind regards,<br/>
    MERIDIAN Health<br/>
    Upper GI, Bariatric &amp; Metabolic Care</p>`;

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE MANIFEST
// name must match the Brevo template name exactly (case-sensitive)
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES = [
  // Stage 00: Instagram / Website Lead Nurture
  // Automation: MH — Social Lead Nurture (Stage 00)
  // SMS 00-02 is configured separately in Brevo SMS; not a template here.
  {
    name: 'MH — Email 00-01 — Social Welcome (Immediate)',
    subject: 'Welcome to MERIDIAN Health',
    bodyHtml: body00_01,
  },
  {
    name: 'MH — Email 00-03 — Social Credibility (24hr)',
    subject: 'Why specialist care makes a difference',
    bodyHtml: body00_03,
  },
  {
    name: 'MH — Email 00-04 — Social Consultation (3 day)',
    subject: 'What to expect at a first consultation',
    bodyHtml: body00_04,
  },
  {
    name: 'MH — Email 00-05 — Social Pathways (5 day)',
    subject: 'Three clinical pathways. One practice.',
    bodyHtml: body00_05,
  },
  // Stage 03–05: Enquiry Nurture stubs
  {
    name: 'MH — Email 03 — Re-Engagement (24hr)',
    subject: 'Following your enquiry with MERIDIAN Health',
    bodyHtml: body03,
  },
  {
    name: 'MH — Email 04 — Consultation Overview (3 day)',
    subject: 'What to expect from an initial consultation',
    bodyHtml: body04,
  },
  {
    name: 'MH — Email 05 — Pathway Overview (5 day)',
    subject: 'Upper GI, Bariatric & Metabolic care pathways',
    bodyHtml: body05,
  },
  // Stage 10A — Sleeve Gastrectomy
  {
    name: 'MH — Pathway 10A — Email 1 — Sleeve Overview',
    subject: 'Your sleeve gastrectomy pathway — what to expect',
    bodyHtml: body10A1,
  },
  {
    name: 'MH — Pathway 10A — Email 2 — Sleeve Preparation',
    subject: 'Preparing for your procedure',
    bodyHtml: body10A2,
  },
  {
    name: 'MH — Pathway 10A — Email 3 — Sleeve Long-Term',
    subject: 'Life after sleeve gastrectomy',
    bodyHtml: body10A3,
  },
  // Stage 10B — Gastric Bypass
  {
    name: 'MH — Pathway 10B — Email 1 — Bypass Overview',
    subject: 'Your gastric bypass pathway — what to expect',
    bodyHtml: body10B1,
  },
  {
    name: 'MH — Pathway 10B — Email 2 — Bypass Preparation',
    subject: 'Preparing for your procedure',
    bodyHtml: body10B2,
  },
  {
    name: 'MH — Pathway 10B — Email 3 — Bypass Long-Term',
    subject: 'Recovery and long-term outcomes',
    bodyHtml: body10B3,
  },
  // Stage 10C — Reflux & Upper GI
  {
    name: 'MH — Pathway 10C — Email 1 — Upper GI Overview',
    subject: 'Your Upper GI pathway — what happens next',
    bodyHtml: body10C1,
  },
  {
    name: 'MH — Pathway 10C — Email 2 — Upper GI Options',
    subject: 'Understanding your treatment options',
    bodyHtml: body10C2,
  },
  {
    name: 'MH — Pathway 10C — Email 3 — Upper GI Long-Term',
    subject: 'Long-term management of Upper GI conditions',
    bodyHtml: body10C3,
  },
  // Stage 10D — GLP-1 & Metabolic Medicine
  {
    name: 'MH — Pathway 10D — Email 1 — Metabolic Overview',
    subject: 'Your metabolic medicine pathway — what to expect',
    bodyHtml: body10D1,
  },
  {
    name: 'MH — Pathway 10D — Email 2 — Metabolic Plan',
    subject: 'Getting the most from your treatment plan',
    bodyHtml: body10D2,
  },
  {
    name: 'MH — Pathway 10D — Email 3 — Metabolic Long-Term',
    subject: 'Long-term metabolic health — beyond the prescription',
    bodyHtml: body10D3,
  },
  // Stage 10E — Revision Procedures
  {
    name: 'MH — Pathway 10E — Email 1 — Revision Overview',
    subject: 'Your revision surgery pathway — what to expect',
    bodyHtml: body10E1,
  },
  {
    name: 'MH — Pathway 10E — Email 2 — Revision Preparation',
    subject: 'Preparing for your revision procedure',
    bodyHtml: body10E2,
  },
  {
    name: 'MH — Pathway 10E — Email 3 — Revision Long-Term',
    subject: 'Long-term care after revision surgery',
    bodyHtml: body10E3,
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

async function brevoPut(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PUT ${path} → ${res.status}: ${err}`);
  }
  return res.status === 204 ? null : res.json();
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching all Brevo templates…');
  const allTemplates = await getAllTemplates();
  console.log(`Found ${allTemplates.length} template(s) in Brevo.\n`);

  const byName = {};
  for (const t of allTemplates) {
    byName[t.name] = t;
  }

  let updated = 0;
  let notFound = 0;
  const notFoundNames = [];

  for (const def of TEMPLATES) {
    const existing = byName[def.name];
    if (!existing) {
      console.warn(`  NOT FOUND: "${def.name}"`);
      notFound++;
      notFoundNames.push(def.name);
      continue;
    }

    try {
      await brevoPut(`/smtp/templates/${existing.id}`, {
        name: def.name,
        subject: def.subject,
        htmlContent: EMAIL_WRAPPER(def.bodyHtml),
        isActive: true,
      });
      console.log(`  ✓ Updated: "${def.name}" (id ${existing.id})`);
      updated++;
    } catch (err) {
      console.error(`  ✗ Error updating "${def.name}": ${err.message}`);
    }
  }

  console.log(`\n──────────────────────────────────────────`);
  console.log(`Templates updated:  ${updated} / ${TEMPLATES.length}`);
  if (notFound > 0) {
    console.log(`Templates not found in Brevo (${notFound}):`);
    for (const n of notFoundNames) {
      console.log(`  • ${n}`);
    }
    console.log('\nCreate these stub templates in Brevo first, then re-run this script.');
  }
  console.log(`\nNext steps (manual — Brevo UI required):`);
  console.log(`  STAGE 00 — Social Lead Nurture:`);
  console.log(`  1. Create stub templates in Brevo for the four Stage 00 emails`);
  console.log(`  2. Create tags: source_instagram, source_website_subscribe, stage00_entered`);
  console.log(`  3. Build automation "MH — Social Lead Nurture (Stage 00)" with triggers above`);
  console.log(`  4. Add SMS 00-02 step (+15 min) — see _docs/brevo-stage-00-instagram-lead-nurture.html`);
  console.log(`  5. Activate automation and test with a contact from each source`);
  console.log(``);
  console.log(`  STAGE 03–05 — Enquiry Nurture:`);
  console.log(`  6. In MH — Enquiry Nurture: review Stage 03–05 steps → activate automation`);
  console.log(``);
  console.log(`  STAGE 10 — Pathway Tracks (requires sign-off first):`);
  console.log(`  7. Obtain clinical sign-off for all 15 Stage 10 emails before activation`);
  console.log(`  8. Once signed off: activate each of the five MH — Pathway: … automations`);
  console.log(`  9. Send a test contact through each automation and confirm merge tags resolve`);
  console.log(`\nSee _docs/brevo-stage-10-sequence-config.html for Stage 10 sequence specs.`);
  console.log(`See _docs/brevo-stage-00-instagram-lead-nurture.html for Stage 00 configuration.`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
