const {
  formatCertificateDate,
  generateCertificatePng,
} = require('./certificate.service');
const { quiz } = require('./quiz.service');

async function sendCertificateEmail({ mailer, to, fullname, role }) {
  const date = formatCertificateDate();
  const certificate = await generateCertificatePng({ fullname, date });
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
