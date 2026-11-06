const {
  formatCertificateDate,
  generateCertificatePng,
} = require('../services/certificate.service');
const { sendCertificateEmail } = require('../services/delivery.service');
const {
  getPublicQuiz,
  normalizeAnswers,
  scoreQuiz,
} = require('../services/quiz.service');
const { InputError } = require('../utils/errors');
const {
  validateEmail,
  validateFullname,
  validateRole,
} = require('../utils/validation');

function getQuiz(_request, response) {
  response.json(getPublicQuiz());
}

async function submitQuiz(request, response) {
  const fullname = validateFullname(
    request.body?.fullname ?? request.body?.name,
  );
  const role = validateRole(request.body?.role);
  const email = validateEmail(request.body?.email);
  const answers = normalizeAnswers(request.body?.answers);

  if (!answers) {
    throw new InputError('Quiz answers are required.');
  }

  const result = scoreQuiz(answers);
  if (!result.passed) {
    return response.status(200).json({ ...result, emailSent: false });
  }

  const date = formatCertificateDate();
  const certificate = await generateCertificatePng({ fullname, date });
  const mailer = request.app.locals.mailer;
  const emailConfigured = Boolean(mailer?.isConfigured());
  const submission = {
    ...result,
    emailSent: false,
    emailQueued: emailConfigured,
    ...(emailConfigured
      ? {}
      : {
          error: 'Email is not configured. Set the SMTP settings in the backend environment.',
        }),
  };

  if (emailConfigured) {
    sendCertificateEmail({
      mailer,
      to: email,
      fullname,
      role,
      date,
      png: certificate,
    }).catch((error) => {
      console.error('Certificate email delivery failed:', error);
    });
  }

  response.set(
    'X-Quiz-Result',
    Buffer.from(JSON.stringify(submission)).toString('base64'),
  );
  return response
    .type('image/png')
    .set('Content-Disposition', 'inline; filename="certificate.png"')
    .send(certificate);
}

module.exports = {
  getQuiz,
  submitQuiz,
};
