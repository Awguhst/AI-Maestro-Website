/* Acquisition layout and download destination checks. Requires Playwright. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
  const output = process.env.SCREENSHOT_DIR || os.tmpdir();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.goto(process.argv[2] || 'http://127.0.0.1:8765');
    assert.equal(await page.locator('a[download]').count(), 2);
    assert(await page.evaluate(() => {
      const build = getComputedStyle(document.querySelector('.s-dl__build'));
      const steps = getComputedStyle(document.querySelector('.s-dl__seq'));
      return build.backgroundColor === steps.backgroundColor && build.backgroundImage === steps.backgroundImage;
    }), 'Install steps should share the build card surface');
    for (const [i, name] of ['standard', 'cuda'].entries()) {
      const card = page.locator('.s-dl__build').nth(i);
      const filename = name === 'standard' ? 'AIMaestro-Setup.exe' : 'AIMaestro-Setup-CUDA.exe';
      assert.equal(await card.locator('a[download]').getAttribute('href'), `downloads/${filename}`);
      assert.equal(await card.locator('.s-dl__filename').innerText(), filename);
      assert.equal(await card.locator(`[data-size="${name}"]`).count(), 1);
      assert.equal(await card.locator(`[data-installed="${name}"]`).count(), 1);
    }
    for (const width of [1440, 1024, 861, 860, 768, 721, 720, 390, 320]) {
      await page.setViewportSize({ width, height: 1100 });
      await page.locator('#download').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
      const boxes = await page.locator('.s-dl__build').evaluateAll(items => items.map(el => {
        const r = el.getBoundingClientRect(), button = el.querySelector('a').getBoundingClientRect();
        return { x: r.x, y: r.y, bottom: r.bottom, width: r.width, buttonY: button.y, buttonHeight: button.height, overflow: el.scrollWidth > el.clientWidth + 1 };
      }));
      assert(boxes.every(box => !box.overflow && box.buttonHeight < 70 && box.buttonHeight >= 44), `Button wrapping at ${width}`);
      if (width > 720) {
        assert.equal(boxes[0].y, boxes[1].y);
        assert.equal(boxes[0].bottom, boxes[1].bottom);
        assert.equal(boxes[0].buttonY, boxes[1].buttonY);
      } else {
        assert.equal(boxes[0].x, boxes[1].x);
        assert(boxes[1].y > boxes[0].bottom);
      }
      assert(await page.locator('.s-dl__stats').evaluateAll(items => items.every(el => el.scrollWidth <= el.clientWidth)));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(output, `aimaestro-download-${width}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const first = page.locator('.s-dl__build').first();
    await first.scrollIntoViewIfNeeded();
    const before = await first.boundingBox();
    await first.hover({ position: { x: 40, y: 40 } });
    await page.waitForFunction(() => document.querySelector('.s-dl__build').classList.contains('is-lit'));
    assert.deepEqual(await first.boundingBox(), before);
    await first.locator('a').focus();
    assert(await first.locator('a').evaluate(el => el.matches(':focus-visible')));
    const step = page.locator('.s-dl__step').first();
    await step.scrollIntoViewIfNeeded();
    const stepBefore = await step.boundingBox();
    await step.hover();
    await page.waitForTimeout(500);
    assert.deepEqual(await step.boundingBox(), stepBefore);
    await page.screenshot({ path: path.join(output, 'aimaestro-download-install.png') });
    console.log('Passed: two unchanged installer URLs; grouped file sizes; aligned build cards/buttons; 9 widths; stable card/step hovers; keyboard focus; no horizontal overflow.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
