/* Optional smoke check. Requires Playwright; the site itself has no dependencies. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
  const base = process.argv[2] || 'http://127.0.0.1:8765';
  const output = process.env.SCREENSHOT_DIR || os.tmpdir();
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(base);
    await page.evaluate(async () => {
      document.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
      await Promise.all([...document.querySelectorAll('img[src]')].map(img => new Promise((resolve, reject) => {
        if (img.complete) return img.naturalWidth ? resolve() : reject(new Error(img.src));
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', () => reject(new Error(img.src)), { once: true });
      })));
      await document.fonts.ready;
    });
    assert.equal(await page.locator('[data-preview]').count(), 6);
    assert.equal(await page.locator('.shot.is-missing').count(), 0);
    const content = await page.locator('body').innerText();
    assert(!/canva|[\u2013\u2014]/i.test(content), 'Old wording or long dash in visible copy');
    assert(!/canva|[\u2013\u2014]/i.test(await page.title()));
    const missingAnchors = await page.locator('a[href^="#"]').evaluateAll(links => links.map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.getElementById(h.slice(1))));
    assert.deepEqual(missingAnchors, []);
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => scrollTo(0, 0));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow at ${width}`);
      await page.screenshot({ path: path.join(output, `aimaestro-site-${width}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('.s-workflow__shots').screenshot({ path: path.join(output, 'aimaestro-site-workflow.png') });
    const preview = page.locator('[data-preview]').first();
    await preview.click();
    assert(await page.locator('dialog').evaluate(d => d.open));
    assert(await page.locator('.preview__close').evaluate(b => b === document.activeElement));
    await page.keyboard.press('Escape');
    assert(!(await page.locator('dialog').evaluate(d => d.open)));
    assert(await preview.evaluate(a => a === document.activeElement), 'Focus must return to preview');
    assert.equal(await page.locator('body').evaluate(b => b.style.overflow), '');
    await page.locator('[data-refusal-dot]').nth(1).click();
    assert.equal(await page.locator('[data-refusal-idx]').innerText(), '02');
    const faq = page.locator('[data-accordion] details').first();
    await faq.locator('summary').click();
    assert(await faq.evaluate(d => d.open));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.burger').click();
    assert.equal(await page.locator('.burger').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.burger').getAttribute('aria-expanded'), 'false');
    const plain = await browser.newPage({ javaScriptEnabled: false });
    await plain.goto(base);
    assert(await plain.locator('.s-hero__preview img').isVisible());
    assert((await plain.locator('[data-preview]').first().getAttribute('href')).endsWith('.webp'));
    const fallback = await browser.newPage();
    await fallback.route('**/overview.webp', route => route.abort());
    await fallback.goto(base);
    await fallback.locator('.s-hero__preview.is-missing').waitFor();
    assert.deepEqual(errors, []);
    console.log('Passed: 6 images; copy; anchors; 3 responsive widths; modal focus/Escape; navigation; FAQ; refusal selector; no-JS links; missing-image fallback; no console or local HTTP errors.');
    console.log(`Visual previews: ${output}`);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
