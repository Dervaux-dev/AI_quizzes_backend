const assert = require('node:assert/strict');
const test = require('node:test');
const sharp = require('sharp');
const {
  CERTIFICATE_HEIGHT,
  CERTIFICATE_WIDTH,
  buildOverlaySvg,
  formatCertificateDate,
  generateCertificatePng,
} = require('../src/services/certificate.service');
const { InputError } = require('../src/utils/errors');
const {
  validateFullname,
  validateRole,
} = require('../src/utils/validation');

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

test('validates and normalizes the recipient full name', () => {
  assert.equal(validateFullname('  Jane   Doe  '), 'Jane Doe');
  assert.throws(() => validateFullname('  '), InputError);
  assert.throws(() => validateFullname(undefined), InputError);
  assert.throws(() => validateFullname('a'.repeat(81)), InputError);
  assert.throws(() => validateFullname('Jane\nDoe'), InputError);
  assert.throws(() => validateFullname('Jane 🚀'), InputError);
});

test('validates the recipient role', () => {
  assert.equal(validateRole('  Student  '), 'Student');
  assert.throws(() => validateRole(''), InputError);
  assert.throws(() => validateRole('a'.repeat(61)), InputError);
});

test('formats the date of issue with the current long-date format', () => {
  assert.equal(
    formatCertificateDate(new Date(2026, 10, 6)),
    '06 November 2026',
  );
});

test('places only the name and date in the SVG overlay', () => {
  const svg = buildOverlaySvg({
    fullname: 'A & B',
    role: 'Student',
    date: '06 November 2026',
  });

  assert.match(svg, /A &amp; B/u);
  assert.doesNotMatch(svg, /Student/u);
  assert.match(svg, /06 November 2026/u);
});

test('generates a 1800x1272 PNG certificate', async () => {
  const certificate = await generateCertificatePng({
    fullname: 'Jane Doe',
    role: 'Student',
  });
  const metadata = await sharp(certificate).metadata();

  assert.ok(Buffer.isBuffer(certificate));
  assert.ok(certificate.subarray(0, 8).equals(PNG_SIGNATURE));
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, CERTIFICATE_WIDTH);
  assert.equal(metadata.height, CERTIFICATE_HEIGHT);
});

test('produces different images for different recipients', async () => {
  const first = await generateCertificatePng({
    fullname: 'Jane Doe',
    role: 'Student',
  });
  const second = await generateCertificatePng({
    fullname: 'John Smith',
    role: 'Student',
  });

  assert.ok(!first.equals(second));
});
