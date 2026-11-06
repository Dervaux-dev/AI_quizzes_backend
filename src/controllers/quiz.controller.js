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

  const mailer = request.app.locals.mailer;
  if (!mailer?.isConfigured()) {
    return response.status(503).json({
      ...result,
      emailSent: false,
      error: 'Email is not configured. Set the SMTP settings in the backend environment.',
    });
  }

  try {
    await sendCertificateEmail({
      mailer,
      to: email,
      fullname,
      role,
    });
  } catch (error) {
    console.error('Certificate email delivery failed:', error);
    return response.status(502).json({
      ...result,
      emailSent: false,
      error: 'The certificate was generated, but the email could not be sent.',
    });
  }

  return response.status(200).json({ ...result, emailSent: true });
}

module.exports = {
  getQuiz,
  submitQuiz,
};
