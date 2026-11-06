require('dotenv').config();

const {
  formatCertificateDate,
  generateCertificatePng,
} = require('../src/services/certificate.service');
const { createMailer } = require('../src/services/mail.service');
const { quiz } = require('../src/services/quiz.service');
const { validateEmail } = require('../src/utils/validation');

async function main() {
  const [recipient, fullname = 'Test Recipient', role = 'Student'] = process.argv
    .slice(2);

  if (!recipient) {
    console.error(
      'Usage: npm run email:test -- you@example.com "Full Name" "Role"',
    );
    process.exitCode = 1;
    return;
  }

  const email = validateEmail(recipient);
  const mailer = createMailer();

  if (!mailer.isConfigured()) {
    console.error(
      'SMTP is not configured. Copy .env.example to .env and fill in the SMTP values.',
    );
    process.exitCode = 1;
    return;
  }

  const date = formatCertificateDate();
  const certificate = await generateCertificatePng({ fullname, date });
  const info = await mailer.sendCertificate({
    to: email,
    fullname,
    role,
    date,
    courseTitle: quiz.title,
    png: certificate,
  });

  console.log(`Certificate emailed to ${email}. Message ID: ${info.messageId}`);
}

main().catch((error) => {
  console.error('Could not send the test certificate:', error.message);
  process.exitCode = 1;
});
