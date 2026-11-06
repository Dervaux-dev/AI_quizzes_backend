const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const { InputError } = require('../utils/errors');
const { validateFullname } = require('../utils/validation');

const BACKGROUND_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'certificate-background.png',
);
const CERTIFICATE_WIDTH = 1800;
const CERTIFICATE_HEIGHT = 1272;

const NAME_LAYOUT = {
  x: 900,
  baseline: 352,
  fontSize: 44,
  minFontSize: 20,
  maxWidth: 1150,
  widthFactor: 0.65,
  color: '#18355f',
};
const DATE_LAYOUT = {
  x: 651,
  baseline: 734,
  fontSize: 26,
  color: '#50575f',
};

let backgroundPromise;

function formatCertificateDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function estimateWidth(text, fontSize, widthFactor) {
  return [...text].length * fontSize * widthFactor;
}

function fitFontSize(text, layout, label) {
  let fontSize = layout.fontSize;

  while (
    fontSize > layout.minFontSize
    && estimateWidth(text, fontSize, layout.widthFactor) > layout.maxWidth
  ) {
    fontSize -= 1;
  }

  if (estimateWidth(text, fontSize, layout.widthFactor) > layout.maxWidth) {
    throw new InputError(
      `${label} is too long to fit on the certificate.`,
    );
  }

  return fontSize;
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/gu, (character) => {
    switch (character) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      default:
        return '&quot;';
    }
  });
}

function buildOverlaySvg({ fullname, date }) {
  const nameFontSize = fitFontSize(fullname, NAME_LAYOUT, 'Full name');

  return `<svg width="${CERTIFICATE_WIDTH}" height="${CERTIFICATE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text x="${NAME_LAYOUT.x}" y="${NAME_LAYOUT.baseline}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${nameFontSize}" fill="${NAME_LAYOUT.color}">${escapeXml(fullname)}</text>
  <text x="${DATE_LAYOUT.x}" y="${DATE_LAYOUT.baseline}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="${DATE_LAYOUT.fontSize}" fill="${DATE_LAYOUT.color}">${escapeXml(date)}</text>
</svg>`;
}

function loadBackground() {
  if (!backgroundPromise) {
    backgroundPromise = fs.readFile(BACKGROUND_PATH);
  }

  return backgroundPromise;
}

async function generateCertificatePng(input) {
  const fullname = validateFullname(input?.fullname ?? input?.name);
  const date = input?.date ?? formatCertificateDate();

  if (typeof date !== 'string') {
    throw new InputError('Date must be a string.');
  }

  const background = await loadBackground();
  const overlay = Buffer.from(buildOverlaySvg({ fullname, date }));

  return sharp(background)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function assertCertificateBackgroundExists() {
  await fs.access(BACKGROUND_PATH);
}

module.exports = {
  CERTIFICATE_HEIGHT,
  CERTIFICATE_WIDTH,
  assertCertificateBackgroundExists,
  buildOverlaySvg,
  formatCertificateDate,
  generateCertificatePng,
};
