const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const https = require("https");

const PORT = process.env.PORT || 5000;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".txt": "text/plain",
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  });
}

http.createServer((req, res) => {
  let urlPath = req.url.split("?")[0];

  // POST /api/enquiry — forward form data to Brevo
  if (req.method === "POST" && urlPath === "/api/enquiry") {
    let rawBody = "";
    req.on("data", (chunk) => { rawBody += chunk; });
    req.on("end", () => {
      const BREVO_API_KEY = process.env.BREVO_API_KEY;
      if (!BREVO_API_KEY) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server misconfiguration" }));
        return;
      }

      let body;
      try { body = JSON.parse(rawBody); } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }

      const { fname, lname, email, phone, pathway, message } = body;
      if (!fname || !lname || !email || !pathway) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing required fields" }));
        return;
      }

      const pathwayTagMap = {
        bariatric: "enquiry_bariatric",
        "upper-gi": "enquiry_uppergi",
        metabolic: "enquiry_metabolic",
        unsure: null,
      };
      const enquiryTag = pathwayTagMap[pathway] || null;

      const contactPayload = JSON.stringify({
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
        ...(enquiryTag ? { tags: [enquiryTag] } : {}),
        updateEnabled: true,
      });

      const reqHeaders = {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Content-Length": Buffer.byteLength(contactPayload),
      };

      const createReq = https.request(
        { hostname: "api.brevo.com", path: "/v3/contacts", method: "POST", headers: reqHeaders },
        (createRes) => {
          let data = "";
          createRes.on("data", (c) => { data += c; });
          createRes.on("end", () => {
            if (createRes.statusCode !== 200 && createRes.statusCode !== 201 && createRes.statusCode !== 204) {
              console.error("Brevo createContact error:", createRes.statusCode, data);
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Failed to create contact in Brevo" }));
              return;
            }

            const trackPayload = JSON.stringify({
              email,
              event: "enquiry_submitted",
              properties: { pathway, submitted_date: new Date().toISOString() },
            });
            const trackHeaders = {
              "ma-key": BREVO_API_KEY,
              "Content-Type": "application/json",
              Accept: "application/json",
              "Content-Length": Buffer.byteLength(trackPayload),
            };
            const trackReq = https.request(
              { hostname: "in-automate.brevo.com", path: "/api/v2/trackEvent", method: "POST", headers: trackHeaders },
              (trackRes) => {
                let td = "";
                trackRes.on("data", (c) => { td += c; });
                trackRes.on("end", () => {
                  if (trackRes.statusCode !== 200 && trackRes.statusCode !== 204) {
                    console.error("Brevo trackEvent error:", trackRes.statusCode, td);
                  }
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ ok: true }));
                });
              }
            );
            trackReq.on("error", (e) => {
              console.error("Brevo trackEvent request error:", e);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ ok: true }));
            });
            trackReq.write(trackPayload);
            trackReq.end();
          });
        }
      );
      createReq.on("error", (e) => {
        console.error("Brevo createContact request error:", e);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      });
      createReq.write(contactPayload);
      createReq.end();
    });
    return;
  }

  // POST /api/deploy — run push.sh and stream output
  if (req.method === "POST" && urlPath === "/api/deploy") {
    const token = process.env.DEPLOY_TOKEN || "";
    const auth = req.headers["x-deploy-token"] || "";

    if (!token || auth !== token) {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorised");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    });

    res.write("Running push.sh...\n");

    const proc = spawn("bash", ["push.sh"], {
      cwd: __dirname,
      env: process.env,
    });

    proc.stdout.on("data", (d) => res.write(d));
    proc.stderr.on("data", (d) => res.write(d));
    proc.on("close", (code) => {
      res.write(code === 0 ? "\nDEPLOY_OK" : "\nDEPLOY_FAIL");
      res.end();
    });
    return;
  }

  if (urlPath === "/" || urlPath === "") urlPath = "/index.html";

  let filePath = path.join(__dirname, urlPath);

  fs.stat(filePath, (err, stat) => {
    // Directory without trailing slash — redirect so relative assets resolve correctly
    if (!err && stat.isDirectory() && !urlPath.endsWith("/")) {
      res.writeHead(301, { "Location": urlPath + "/" });
      res.end();
      return;
    }
    if (!err && stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.access(filePath, fs.constants.F_OK, (accessErr) => {
      if (accessErr) {
        if (!path.extname(filePath)) {
          const htmlPath = filePath + ".html";
          fs.access(htmlPath, fs.constants.F_OK, (htmlErr) => {
            if (!htmlErr) {
              serveFile(res, htmlPath);
            } else {
              res.writeHead(404, { "Content-Type": "text/plain" });
              res.end("Not found");
            }
          });
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
        }
      } else {
        serveFile(res, filePath);
      }
    });
  });
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
