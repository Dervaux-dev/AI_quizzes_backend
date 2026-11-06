const {
  formatCertificateDate,
  generateCertificatePng,
} = require('./certificate.service');
const { quiz } = require('./quiz.service');

async function sendCertificateEmail({
  mailer,
  to,
  fullname,
  role,
  date = formatCertificateDate(),
  png,
}) {
  const certificate = png ?? await generateCertificatePng({ fullname, date });
  const info = await mailer.sendCertificate({
    to,
    fullname,
    role,
    date,
    courseTitle: quiz.title,
    png: certificate,
  });

  return { date, info };
}

module.exports = { sendCertificateEmail };
