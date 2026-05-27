exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const netlifyContext = process.env.CONTEXT || "dev";
  const isProduction = netlifyContext === "production";

  let BREVO_API_KEY;
  let keySource;

  if (isProduction) {
    BREVO_API_KEY = process.env.BREVO_API_KEY;
    keySource = "LIVE (BREVO_API_KEY)";
    if (!BREVO_API_KEY) {
      console.error("BREVO_API_KEY is not set in production context");
      return { statusCode: 500, body: JSON.stringify({ error: "Server misconfiguration" }) };
    }
  } else {
    BREVO_API_KEY = process.env.BREVO_TEST_API_KEY;
    keySource = "TEST (BREVO_TEST_API_KEY)";
    if (!BREVO_API_KEY) {
      console.error(
        "BREVO_TEST_API_KEY is not set for non-production context:", netlifyContext,
        "— refusing to fall back to live key. Add BREVO_TEST_API_KEY in Netlify → Site settings → Environment variables."
      );
      return { statusCode: 500, body: JSON.stringify({ error: "Server misconfiguration" }) };
    }
  }

  console.log("Brevo enquiry — context:", netlifyContext, "| key:", keySource);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { fname, lname, email, phone, pathway, message } = body;

  if (!fname || !lname || !email || !pathway) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  const pathwayTagMap = {
    bariatric: "enquiry_bariatric",
    "upper-gi": "enquiry_uppergi",
    metabolic: "enquiry_metabolic",
    unsure: null,
  };

  const enquiryTag = pathwayTagMap[pathway] || null;
  const listIds = [enquiryTag ? getListId(enquiryTag) : null].filter(Boolean);

  const contactPayload = {
    email,
    firstName: fname,
    lastName: lname,
    attributes: {
      FIRSTNAME: fname,
      LASTNAME: lname,
      enquiry_submitted_date: new Date().toISOString().split("T")[0],
      ENQUIRY_PATHWAY: pathway,
      ENQUIRY_MESSAGE: message || "",
    },
    updateEnabled: true,
  };

  if (enquiryTag) {
    contactPayload.tags = [enquiryTag];
  }

  const headers = {
    "api-key": BREVO_API_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    const createRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers,
      body: JSON.stringify(contactPayload),
    });

    if (!createRes.ok && createRes.status !== 204) {
      const errText = await createRes.text();
      console.error("Brevo createContact error:", createRes.status, errText);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Failed to create contact in Brevo" }),
      };
    }

    const trackPayload = {
      email,
      event: "enquiry_submitted",
      properties: {
        pathway,
        submitted_date: new Date().toISOString(),
      },
    };

    const trackRes = await fetch("https://in-automate.brevo.com/api/v2/trackEvent", {
      method: "POST",
      headers: { ...headers, "ma-key": BREVO_API_KEY },
      body: JSON.stringify(trackPayload),
    });

    if (!trackRes.ok && trackRes.status !== 204) {
      const errText = await trackRes.text();
      console.error("Brevo trackEvent error:", trackRes.status, errText);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("Brevo API fetch error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

function getListId(tag) {
  const map = {
    enquiry_bariatric: null,
    enquiry_uppergi: null,
    enquiry_metabolic: null,
  };
  return map[tag];
}
