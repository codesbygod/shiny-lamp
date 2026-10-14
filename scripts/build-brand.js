'use strict';

/**
 * Build every brand asset from the geometry in src/bank/site/logo.js.
 *
 *   npm run build:brand
 *
 * Writes:
 *
 *   assets/bank/logo-dark.png       lockup for paper and white pages
 *   assets/bank/logo-light.png      lockup for navy panels and the footer
 *   assets/bank/logomark-dark.png   the R alone, as supplied
 *   assets/bank/logomark-light.png  the R with its darkest greens lifted, for navy
 *   assets/bank/mark-dark.svg       the R as a vector, for print and email
 *   assets/bank/mark-light.svg
 *   assets/bank/icon-512.png        the R on a white tile
 *   favicon.png, apple-touch-icon.png, favicon.ico (16, 32, 48)
 *   assets/bank/og-image.png        the card a shared link unfurls into
 *
 * Rendered in Chromium through playwright-core - already a dev dependency for
 * the browser tests - so the wordmark is set in the same self-hosted
 * Montserrat as the site's headlines. Not part of `npm run build`:
 * the outputs are committed, because they change when the logo does.
 */

const fs = require('fs');
const path = require('path');
const { COLORS, MARK_BOX, mark, markSvg, lockupSvg } = require('../src/bank/site/logo');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const BRAND = path.join(PUBLIC, 'assets', 'bank');
const FONTS = path.join(PUBLIC, 'assets', 'fonts');

let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch (err) {
  console.error('[brand] needs playwright-core: npm i -D playwright-core');
  process.exit(1);
}

function browserPath() {
  return [
    process.env.CHROME_PATH,
    '/opt/pw-browsers/chromium',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ].filter(Boolean).find((candidate) => {
    try { return fs.existsSync(candidate); } catch (err) { return false; }
  });
}

/** The faces the artwork uses, inlined so the page needs no server. */
function fontFaces() {
  const face = (family, weight, file) => {
    const data = fs.readFileSync(path.join(FONTS, file)).toString('base64');
    return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2')}`;
  };
  return [
    face('Montserrat', '500 800', 'montserrat-500-latin.woff2'),
    face('Plus Jakarta Sans', 600, 'plus-jakarta-sans-600-latin.woff2'),
  ].join('\n');
}

const FACES = fontFaces();

const doc = (body, background = 'transparent') => `<!doctype html><html><head><meta charset="utf-8"><style>
${FACES}
html,body{margin:0;padding:0;background:${background}}
#art{display:inline-block}
</style></head><body><div id="art">${body}</div></body></html>`;

/** Render a fragment and screenshot it, transparent unless it paints a ground. */
async function render(page, body, { background } = {}) {
  await page.setContent(doc(body, background), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const art = await page.$('#art');
  return art.screenshot({ omitBackground: !background });
}

function write(file, buffer) {
  fs.writeFileSync(file, buffer);
  console.log(`  wrote ${path.relative(PUBLIC, file)} (${(buffer.length / 1024).toFixed(1)}kB)`);
}

/**
 * An .ico holding PNG images, which every browser since IE 9 reads. The
 * format is a six-byte header, a sixteen-byte entry per image, then the
 * images themselves.
 */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

/** The R inside a square of `size`, inset by `pad` of the square. */
function markIn(size, pad, on = 'paper') {
  const { x, y, w, h } = MARK_BOX;
  const inner = Math.round(size * (1 - 2 * pad));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${inner}" height="${Math.round((inner * h) / w)}">${mark({ on, id: `rk-${size}` })}</svg>`;
}

/**
 * The icon: the R on a white rounded tile, the ground it was drawn for.
 * Below 64px a tile only shrinks the drawing inside it, so the tab-sized
 * icons are the bare R, as large as the square allows.
 */
function tile(size) {
  if (size < 64) {
    return `<div style="width:${size}px;height:${size}px;display:grid;place-items:center">${markIn(size, 0.02)}</div>`;
  }
  const radius = Math.round(size * 0.22);
  return `<div style="width:${size}px;height:${size}px;border-radius:${radius}px;background:#ffffff;display:grid;place-items:center;box-shadow:inset 0 0 0 ${Math.max(1, Math.round(size / 180))}px #dfe5ea">${markIn(size, 0.17)}</div>`;
}

/**
 * The link card: the lockup on pale paper, the mint band of the R repeated
 * as two broad diagonal stripes, the tagline under it.
 */
function card() {
  const { BANK } = require('../src/bank/constants');
  return `<div style="position:relative;width:1200px;height:630px;overflow:hidden;background:${COLORS.paper}">
    <div style="position:absolute;left:-120px;top:440px;width:620px;height:84px;background:${COLORS.mint};opacity:.55;transform:rotate(-29.6deg)"></div>
    <div style="position:absolute;left:-60px;top:520px;width:620px;height:30px;background:${COLORS.emerald};opacity:.85;transform:rotate(-29.6deg)"></div>
    <div style="position:absolute;right:-150px;top:40px;width:560px;height:70px;background:${COLORS.mint};opacity:.45;transform:rotate(-29.6deg)"></div>
    <div style="position:absolute;left:0;right:0;top:150px;display:flex;justify-content:center">${lockupSvg({ on: 'paper', height: 190 })}</div>
    <div style="position:absolute;left:0;right:0;top:400px;text-align:center;font-family:'Montserrat';font-weight:700;font-size:38px;letter-spacing:-.01em;color:${COLORS.navy}">${BANK.tagline}</div>
    <div style="position:absolute;left:0;right:0;top:466px;display:flex;justify-content:center"><span style="display:block;width:72px;height:4px;border-radius:2px;background:${COLORS.emerald}"></span></div>
    <div style="position:absolute;left:0;right:0;bottom:46px;text-align:center;font-family:'Plus Jakarta Sans';font-weight:600;font-size:16px;letter-spacing:.28em;color:${COLORS.emeraldDeep}">PERSONAL &nbsp;·&nbsp; BUSINESS &nbsp;·&nbsp; ONLINE BANKING</div>
  </div>`;
}

(async () => {
  const executablePath = browserPath();
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  console.log('[brand] rendering from src/bank/site/logo.js');

  // Lockups at 160px tall: about three times the largest place they appear.
  write(path.join(BRAND, 'logo-dark.png'), await render(page, lockupSvg({ on: 'paper', height: 160 })));
  write(path.join(BRAND, 'logo-light.png'), await render(page, lockupSvg({ on: 'navy', height: 160 })));

  const { w, h } = MARK_BOX;
  const markPng = (on) => markSvg({ on, width: Math.round((160 * w) / h), height: 160 });
  write(path.join(BRAND, 'logomark-dark.png'), await render(page, markPng('paper')));
  write(path.join(BRAND, 'logomark-light.png'), await render(page, markPng('navy')));
  write(path.join(BRAND, 'mark-dark.svg'), Buffer.from(markSvg({ on: 'paper' })));
  write(path.join(BRAND, 'mark-light.svg'), Buffer.from(markSvg({ on: 'navy' })));

  const icon512 = await render(page, tile(512));
  write(path.join(BRAND, 'icon-512.png'), icon512);
  write(path.join(PUBLIC, 'favicon.png'), icon512);
  write(path.join(PUBLIC, 'apple-touch-icon.png'), await render(page, tile(180)));
  const sizes = [16, 32, 48];
  const pngs = [];
  for (const size of sizes) pngs.push({ size, data: await render(page, tile(size)) });
  write(path.join(PUBLIC, 'favicon.ico'), ico(pngs));

  await page.setViewportSize({ width: 1200, height: 630 });
  write(path.join(BRAND, 'og-image.png'), await render(page, card(), { background: COLORS.paper }));

  await browser.close();
  console.log('[brand] done');
})().catch((err) => {
  console.error('[brand] failed:', err);
  process.exit(1);
});
