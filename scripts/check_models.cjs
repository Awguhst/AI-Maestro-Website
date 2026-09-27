/* Model library layout and hover checks. Requires Playwright. */
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
    assert.equal(await page.locator('.s-models__row').count(), 9);
    assert.equal(await page.locator('.s-models__cell').count(), 9);
    for (const width of [1440, 1024, 861, 860, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1100 });
      await page.locator('.s-models__grid').scrollIntoViewIfNeeded();
      const rows = await page.locator('.s-models__row').evaluateAll(items => items.map(row => {
        const name = row.querySelector('dt').getBoundingClientRect();
        const task = row.querySelector('dd').getBoundingClientRect();
        return { gap: task.left - name.right, overflow: row.scrollWidth > row.clientWidth, right: task.right };
      }));
      assert(rows.every(row => row.gap >= 11 && !row.overflow), `No row overlap at ${width}`);
      assert(rows.every(row => Math.abs(row.right - rows[0].right) < 1), `Task column alignment at ${width}`);
      const cells = await page.locator('.s-models__group').first().locator('li').evaluateAll(items => items.map(el => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, overflow: el.scrollWidth > el.clientWidth };
      }));
      assert.equal(cells[0].y, cells[1].y);
      assert.equal(cells[2].y, cells[3].y);
      assert(cells[2].y > cells[0].y && cells.every(cell => !cell.overflow), `Balanced two-column formats at ${width}`);
      const wide = await page.locator('.s-models__cell--wide').boundingBox();
      assert(wide.width > cells[0].width * 1.9, `Long dataset name spans both columns at ${width}`);
      if (width > 860) {
        const cols = await page.locator('.s-models__col').evaluateAll(items => items.map(el => el.getBoundingClientRect().height));
        assert(Math.abs(cols[0] - cols[1]) < 1, 'Desktop panels should align');
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(output, `aimaestro-models-${width}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const tile = page.locator('.s-models__cell').first();
    await tile.scrollIntoViewIfNeeded();
    await page.mouse.move(1, 1);
    const before = await tile.evaluate(el => ({ gradient: getComputedStyle(el).backgroundImage, shadow: getComputedStyle(el).boxShadow }));
    const box = await tile.boundingBox();
    await tile.hover();
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.s-models__col--data .card__glow')).opacity) === 1);
    const after = await tile.evaluate(el => ({ gradient: getComputedStyle(el).backgroundImage, shadow: getComputedStyle(el).boxShadow }));
    assert.notEqual(before.gradient, 'none');
    assert.equal(after.gradient, before.gradient, 'Hover must retain the gradient');
    assert.notEqual(after.shadow, before.shadow);
    assert.deepEqual(await tile.boundingBox(), box, 'Hover must keep tile bounds stable');
    await page.screenshot({ path: path.join(output, 'aimaestro-models-hover.png') });
    const preview = page.locator('#models [data-preview]');
    await preview.click();
    assert(await page.locator('dialog').evaluate(d => d.open));
    await page.keyboard.press('Escape');
    console.log('Passed: 9 model rows; aligned task labels; balanced data tiles; long dataset name; 7 viewport widths; stable hover bounds and gradient; molecule preview.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
