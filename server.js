const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

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
