/* FAQ animation and visual regression checks. Requires Playwright. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
  const base = process.argv[2] || 'http://127.0.0.1:8765';
  const output = process.env.SCREENSHOT_DIR || os.tmpdir();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(base);
    const first = page.locator('.s-faq__item').first();
    const second = page.locator('.s-faq__item').nth(1);
    const settle = () => page.waitForFunction(() => [...document.querySelectorAll('.s-faq__panel')].every(p => !p.getAnimations().length));
    await first.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.s-faq__list')).opacity === '1');
    await first.locator('summary').click();
    assert.equal(await first.locator('[data-panel]').evaluate(p => p.getAnimations()[0].effect.getKeyframes()[0].height), '0px', 'Closed answers must animate from zero, even when hidden content has a measurable height');
    await settle();
    const before = await page.evaluate(() => scrollY);
    await second.locator('summary').click();
    assert.equal(await first.locator('summary').getAttribute('aria-expanded'), 'false');
    assert.equal(await first.getAttribute('data-expanded'), 'false', 'Closing icon must respond before the animation ends');
    await settle();
    assert.equal(await page.locator('.s-faq__item[open]').count(), 1);
    assert(Math.abs(await page.evaluate(() => scrollY) - before) < 1, 'Switching visible answers must not jump the viewport');
    await first.locator('summary').click();
    await page.waitForTimeout(70);
    await first.locator('summary').click();
    await page.waitForTimeout(70);
    await first.locator('summary').click();
    await settle();
    assert(await first.evaluate(d => d.open));
    await first.locator('summary').click();
    await settle();
    await first.locator('summary').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await settle();
    assert(await first.evaluate(d => d.open), 'Resize must settle to the requested state');
    const sizes = await first.locator('[data-panel]').evaluate(p => ({ height: p.clientHeight, content: p.scrollHeight }));
    assert(Math.abs(sizes.height - sizes.content) <= 1, 'Resized answer must not be clipped');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const item of await page.locator('.s-faq__item').all()) {
        if (!(await item.evaluate(d => d.open))) await item.locator('summary').click();
        const layout = await item.evaluate(d => {
          const row = d.getBoundingClientRect();
          const text = d.querySelector('.s-faq__q-text').getBoundingClientRect();
          const icon = d.querySelector('.s-faq__ico').getBoundingClientRect();
          const answer = d.querySelector('.s-faq__a');
          const p = d.querySelector('[data-panel]');
          return { inset: text.left - row.left, gap: icon.left - text.right, right: row.right - icon.right, answerInset: parseFloat(getComputedStyle(answer).paddingLeft), clipped: p.clientHeight < p.scrollHeight - 1 };
        });
        assert(layout.inset >= 12 && layout.right >= 12 && layout.answerInset >= 12, `Text/icon padding at ${width}`);
        assert(layout.gap >= 10 && !layout.clipped, `Answer or icon clipping at ${width}`);
      }
      await first.locator('summary').click();
      await page.locator('.s-faq__head').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await page.evaluate(() => scrollBy({ top: -100, behavior: 'instant' }));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(output, `aimaestro-faq-${width}.png`) });
    }
    const plain = await browser.newPage({ javaScriptEnabled: false });
    await plain.goto(base);
    await plain.locator('.s-faq__q').first().click();
    assert(await plain.locator('.s-faq__item').first().evaluate(d => d.open));
    console.log('Passed: FAQ opening from zero; immediate closing indicator; single-open switching; stable scroll; interrupted animation; resize while opening; all 10 answers at 4 widths; no-JS fallback.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
