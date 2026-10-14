'use strict';

/**
 * The Rockfeild mark, as geometry.
 *
 * One drawing, every size: scripts/build-brand.js renders the PNG lockups,
 * the favicon set and the link card from these functions, so changing the
 * logo is an edit here and `npm run build:brand`, never a trip through an
 * image editor.
 *
 * The mark is a folded R. A sheared stem in dark green, an emerald bowl and
 * leg, and a mint band crossing the waist at the same -30 degree pitch the
 * stem is cut to, with a shadow where the band folds under the bowl. The
 * wordmark is ROCKFEILD over NATIONAL BANK in Montserrat, navy.
 *
 * Coordinates are in the artwork's own 1344 x 576 pixel space, so the drawing
 * can be checked against the supplied logo point for point; the viewBoxes
 * below crop to the part each output needs.
 */

/** The palette the artwork is drawn in. Mirrors the --rf-* tokens in bank.css. */
const COLORS = {
  navy: '#0b1f44',
  navyDeep: '#071634',
  navyLift: '#16305e',
  stem: '#0e5c43',
  stemShade: '#063f2c',
  emerald: '#0a7d57',
  emeraldDeep: '#0a5a40',
  mint: '#8edcb4',
  mintLight: '#b5ecd0',
  paper: '#f4f6f8',
};

/* The three parallel lines the fold is built on: L1 is the top of the shadow,
   L2 the top of the mint band, L3 its foot. Each falls 0.569 for every unit
   it runs left - the pitch of the stem's top edge. */
const PITCH = 0.569;
const at = (base, x) => +(base - PITCH * (x - 172)).toFixed(2);
const L1 = (x) => at(285, x);
const L2 = (x) => at(322, x);
const L3 = (x) => at(365, x);

/** The mark's bounds in artwork space. */
const MARK_BOX = { x: 86, y: 163, w: 262, h: 255 };

/**
 * The R as an SVG fragment (no outer <svg>), in artwork coordinates.
 *
 * `on` is the ground: 'paper' draws it as supplied; 'navy' lifts the two
 * darkest greens a step, because on a navy panel they would otherwise sink
 * into it and the stem would disappear.
 */
function mark({ on = 'paper', id = 'rk' } = {}) {
  const lift = on === 'navy';
  const stem = lift ? '#137352' : COLORS.stem;
  const stemShade = lift ? '#0a5038' : COLORS.stemShade;
  return `
  <defs>
    <linearGradient id="${id}-fold" x1="172" y1="0" x2="324" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${lift ? '#0a5038' : '#07432f'}"/>
      <stop offset="1" stop-color="${COLORS.emerald}"/>
    </linearGradient>
    <linearGradient id="${id}-band" x1="172" y1="0" x2="324" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${COLORS.mint}"/>
      <stop offset="1" stop-color="${COLORS.mintLight}"/>
    </linearGradient>
  </defs>
  <path fill="${COLORS.emerald}" fill-rule="evenodd" d="M172 165H244A80 80 0 0 1 324 245V${L3(324)}L172 ${L3(172)}Z M172 215H245A17 17 0 0 1 245 249H172Z"/>
  <path fill="${COLORS.emerald}" d="M205 ${L3(205)}L268 ${L3(268)}L345 415H248Z"/>
  <path fill="url(#${id}-fold)" d="M172 ${L1(172)}L324 ${L1(324)}V${L2(324)}L172 ${L2(172)}Z"/>
  <path fill="url(#${id}-band)" d="M172 ${L2(172)}L324 ${L2(324)}V${L3(324)}L172 ${L3(172)}Z"/>
  <path fill="${stem}" d="M88 215L172 165V${L1(172)}L88 ${L1(88)}Z"/>
  <path fill="${stemShade}" d="M88 ${L1(88)}L172 ${L1(172)}V365L88 415Z"/>`;
}

/** The R as a standalone SVG document, cropped to the mark. */
function markSvg({ on = 'paper', width, height } = {}) {
  const { x, y, w, h } = MARK_BOX;
  const size = width && height ? ` width="${width}" height="${height}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}"${size}>${mark({ on })}</svg>`;
}

/**
 * The full lockup as inline SVG: the R, then ROCKFEILD over NATIONAL BANK.
 *
 * Set in live Montserrat, so it is for rendering in a page that has loaded
 * the face (the build), not for shipping as a file: an SVG used as an <img>
 * cannot load web fonts. textLength sets each line to the width it has in the
 * supplied artwork, so the two lines end where the logo has them end.
 * `on` is the ground it will sit on - 'paper' or 'navy' - and decides the ink.
 */
function lockupSvg({ on = 'paper', height = 160 } = {}) {
  const ink = on === 'navy' ? '#ffffff' : COLORS.navy;
  const sub = on === 'navy' ? '#d6f2e4' : COLORS.navy;
  const box = { x: 84, y: 161, w: 1180, h: 259 };
  const width = Math.round((height * box.w) / box.h);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="${width}" height="${height}">
  ${mark({ on, id: `rk-${on}` })}
  <text x="368" y="328" fill="${ink}" font-family="Montserrat" font-weight="800" font-size="161" textLength="890" lengthAdjust="spacingAndGlyphs">ROCKFEILD</text>
  <text x="372" y="408" fill="${sub}" font-family="Montserrat" font-weight="500" font-size="54" textLength="868" lengthAdjust="spacing">NATIONAL BANK</text>
</svg>`;
}

module.exports = { COLORS, MARK_BOX, mark, markSvg, lockupSvg };
