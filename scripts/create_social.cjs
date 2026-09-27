/* Run after capture_app.py. Requires Playwright to export the SVG as PNG. */
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const assets = path.resolve(__dirname, '../assets');
  const screenshot = (await fs.readFile(path.join(assets, 'screenshots/results.webp'))).toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#070707"/>
  <path d="M32 64V32h32M1136 598h32v-32" fill="none" stroke="#555552"/>
  <g transform="translate(54 69) scale(.24)" fill="none" stroke="#f4f3f0" stroke-width="5">
    <path d="M4.5 4.5L96 98.5L187.5 4.5V195.5L154.5 162.5V88L96 149L37.5 88V162.5L4.5 195.5Z"/>
  </g>
  <g font-family="Segoe UI, Arial, sans-serif" fill="#f4f3f0">
    <text x="119" y="100" font-size="25" letter-spacing="5">AI MAESTRO</text>
    <text x="54" y="235" font-size="45" font-weight="300">Machine learning,</text>
    <text x="54" y="293" font-size="45" font-weight="300">made visual.</text>
    <text x="56" y="346" font-size="19" fill="#a9a8a4">Connect. Train. Explore.</text>
    <text x="56" y="559" font-size="14" fill="#a9a8a4" letter-spacing="3">FOR WINDOWS 10 &amp; 11</text>
  </g>
  <rect x="476" y="80" width="688" height="459" fill="#202020" stroke="#494947"/>
  <image x="477" y="81" width="686" height="457" href="data:image/webp;base64,${screenshot}"/>
  <text x="478" y="570" font-family="Consolas, monospace" font-size="12" fill="#a9a8a4" letter-spacing="2">YOUR WORKFLOW. YOUR RESULTS.</text>
</svg>`;
  await fs.writeFile(path.join(assets, 'og-image.svg'), svg);
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(`<body style="margin:0">${svg}</body>`);
    await page.waitForLoadState('load');
    await page.screenshot({ path: path.join(assets, 'og-image.png') });
  } finally { await browser.close(); }
  console.log('Updated 1200 x 630 social preview from the real app capture.');
})().catch(e => { console.error(e); process.exitCode = 1; });
