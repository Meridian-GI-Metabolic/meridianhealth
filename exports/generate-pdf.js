const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  const htmlPath = path.resolve(__dirname, 'meridian-market-context-2026.html');
  const outputPath = path.resolve(__dirname, 'meridian-market-context-2026.pdf');
  const monogramPath = path.resolve(__dirname, '../brand/monogram.png');

  let html = fs.readFileSync(htmlPath, 'utf8');

  const monogramData = fs.readFileSync(monogramPath);
  const monogramBase64 = 'data:image/png;base64,' + monogramData.toString('base64');
  html = html.replace(/MONOGRAM_PLACEHOLDER/g, monogramBase64);

  const NIX_CHROMIUM = '/nix/store/43y6k6fj85l4kcd1yan43hpdld6nmjmp-ungoogled-chromium-131.0.6778.204/bin/chromium';
  const chromiumPath = process.env.CHROMIUM_PATH ||
    (fs.existsSync(NIX_CHROMIUM) ? NIX_CHROMIUM : undefined);

  const browser = await puppeteer.launch({
    headless: true,
    ...(chromiumPath ? { executablePath: chromiumPath } : {}),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none'
    ]
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: ['networkidle0', 'domcontentloaded']
  });

  await new Promise(r => setTimeout(r, 2000));

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0'
    },
    preferCSSPageSize: true
  });

  await browser.close();
  console.log('PDF exported to:', outputPath);
}

generatePDF().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
