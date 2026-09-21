// Regenerates Appendix E ("Physical Testing Checklist") in
// Kids_Bible_Quiz_Development_Plan.pdf from scripts/testing-checklist-data.js.
//
// Safe to re-run: it strips whatever appendix pages it generated last time
// (tracked via a PDF keyword, not by guessing from content) before drawing
// fresh ones from the full, current data file. Add a new phase entry to
// testing-checklist-data.js, then run:
//   node scripts/build-testing-checklist.js
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const phases = require('./testing-checklist-data');

const PDF_PATH = path.join(__dirname, '..', 'Kids_Bible_Quiz_Development_Plan.pdf');
const PAGE_COUNT_KEYWORD_PREFIX = 'kbq-appendix-e-pages:';

// Colors sampled from the existing document's navy/orange scheme.
const NAVY = rgb(0x1b / 255, 0x37 / 255, 0x60 / 255);
const ORANGE = rgb(0xd9 / 255, 0x8e / 255, 0x1b / 255);
const BODY = rgb(0.15, 0.16, 0.2);
const GRAY = rgb(0.42, 0.43, 0.47);
const RULE = rgb(0.85, 0.85, 0.85);

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_L = 72;
const MARGIN_R = 72;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const TOP_Y = 720;
const FOOTER_Y = 46;
const FOOTER_RULE_Y = 60;

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function main() {
  const bytes = fs.readFileSync(PDF_PATH);
  const doc = await PDFDocument.load(bytes);

  // Strip whatever this script generated last time, tracked via keyword
  // rather than sniffed from content, so re-runs are exact, not fuzzy.
  const priorCount = (doc.getKeywords() || '')
    .split(',')
    .map((k) => k.trim())
    .find((k) => k.startsWith(PAGE_COUNT_KEYWORD_PREFIX));
  if (priorCount) {
    const n = Number(priorCount.slice(PAGE_COUNT_KEYWORD_PREFIX.length));
    for (let i = 0; i < n; i++) {
      doc.removePage(doc.getPageCount() - 1);
    }
  }

  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helvOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = TOP_Y;
  let pagesAdded = 1;

  function drawFooter() {
    page.drawLine({
      start: { x: MARGIN_L, y: FOOTER_RULE_Y },
      end: { x: PAGE_W - MARGIN_R, y: FOOTER_RULE_Y },
      thickness: 0.75,
      color: RULE,
    });
    page.drawText('Kids Bible Quiz — Development Plan', {
      x: MARGIN_L,
      y: FOOTER_Y,
      size: 9,
      font: helv,
      color: GRAY,
    });
    const label = 'Appendix E';
    const labelWidth = helv.widthOfTextAtSize(label, 9);
    page.drawText(label, {
      x: PAGE_W - MARGIN_R - labelWidth,
      y: FOOTER_Y,
      size: 9,
      font: helv,
      color: GRAY,
    });
  }

  function newPage() {
    drawFooter();
    page = doc.addPage([PAGE_W, PAGE_H]);
    pagesAdded++;
    y = TOP_Y;
  }

  function ensureSpace(needed) {
    if (y - needed < FOOTER_RULE_Y + 20) {
      newPage();
    }
  }

  function drawMainHeading(text) {
    page.drawRectangle({ x: MARGIN_L, y, width: 40, height: 4, color: ORANGE });
    y -= 22;
    for (const line of wrapText(text, helvBold, 19, CONTENT_W)) {
      page.drawText(line, { x: MARGIN_L, y, size: 19, font: helvBold, color: NAVY });
      y -= 24;
    }
    y -= 4;
  }

  function drawParagraph(text, opts = {}) {
    const size = opts.size ?? 10.5;
    const lineHeight = opts.lineHeight ?? 14;
    const font = opts.font ?? helv;
    const color = opts.color ?? BODY;
    const width = opts.width ?? CONTENT_W;
    const x = opts.x ?? MARGIN_L;
    for (const line of wrapText(text, font, size, width)) {
      ensureSpace(lineHeight);
      page.drawText(line, { x, y, size, font, color });
      y -= lineHeight;
    }
  }

  function drawPhaseHeading(text) {
    ensureSpace(30);
    y -= 6;
    page.drawText(text, { x: MARGIN_L, y, size: 13, font: helvBold, color: NAVY });
    y -= 18;
  }

  function drawChecklistItem(title, body) {
    const boxSize = 9;
    const textX = MARGIN_L + 18;
    const textWidth = CONTENT_W - 18;
    ensureSpace(16);
    page.drawRectangle({
      x: MARGIN_L,
      y: y - 8,
      width: boxSize,
      height: boxSize,
      borderColor: NAVY,
      borderWidth: 1,
    });
    const titleLines = wrapText(title, helvBold, 10.5, textWidth);
    for (const line of titleLines) {
      ensureSpace(14);
      page.drawText(line, { x: textX, y, size: 10.5, font: helvBold, color: NAVY });
      y -= 14;
    }
    drawParagraph(body, { x: textX, width: textWidth });
    y -= 10;
  }

  drawMainHeading('Appendix E — Physical Testing Checklist');
  drawParagraph(
    'A running checklist of items that need a human, a real browser, or a real device to confirm — things ' +
      'automated testing (type-checks, direct API requests, or a scripted browser session) cannot fully ' +
      'exercise on its own. One section is added per completed phase; each item should be checked once, ' +
      'either right after the phase that introduced it or during Phase 13’s full Integration & End-to-End ' +
      'Testing pass, alongside the Section 7 checklist.',
    { font: helvOblique, color: GRAY }
  );
  y -= 6;

  for (const phase of phases) {
    drawPhaseHeading(phase.phase);
    if (phase.intro) {
      drawParagraph(phase.intro);
      y -= 8;
    }
    if (phase.items.length > 0) {
      for (const item of phase.items) {
        drawChecklistItem(item.title, item.body);
      }
    } else {
      drawParagraph('No physical testing required for this phase.', { font: helvOblique, color: GRAY });
      y -= 8;
    }
    if (phase.closing) {
      ensureSpace(30);
      page.drawText('RISKS / DEPENDENCIES', { x: MARGIN_L, y, size: 11, font: helvBold, color: NAVY });
      y -= 16;
      drawParagraph(phase.closing);
    }
    y -= 14;
  }

  drawFooter();

  doc.setKeywords([`${PAGE_COUNT_KEYWORD_PREFIX}${pagesAdded}`]);

  const outBytes = await doc.save();
  fs.writeFileSync(PDF_PATH, outBytes);
  console.log(`Regenerated Appendix E (${pagesAdded} page(s)). Total pages: ${doc.getPageCount()}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
