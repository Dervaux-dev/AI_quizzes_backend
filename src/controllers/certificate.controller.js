const { generateCertificatePng } = require('../services/certificate.service');
const { sendCertificateEmail } = require('../services/delivery.service');
const {
  validateEmail,
  validateFullname,
  validateRole,
} = require('../utils/validation');

async function previewCertificate(request, response) {
  const fullname = validateFullname(
    request.body?.fullname ?? request.body?.name,
  );
  const certificate = await generateCertificatePng({ fullname });

  response
    .type('image/png')
    .set('Content-Disposition', 'inline; filename="certificate-preview.png"')
    .send(certificate);
}

async function emailCertificate(request, response) {
  const fullname = validateFullname(
    request.body?.fullname ?? request.body?.name,
  );
  const role = validateRole(request.body?.role);
  const email = validateEmail(request.body?.email);
  const mailer = request.app.locals.mailer;

  if (!mailer?.isConfigured()) {
    return response.status(503).json({
      status: 'not_sent',
      error: 'Email is not configured. Set the SMTP settings in the backend environment.',
    });
  }

  try {
    const { info } = await sendCertificateEmail({
      mailer,
      to: email,
      fullname,
      role,
    });

    return response.status(200).json({
      status: 'sent',
      messageId: info?.messageId,
    });
  } catch (error) {
    console.error('Certificate email delivery failed:', error);
    return response.status(502).json({
      status: 'not_sent',
      error: 'The certificate was generated, but the email could not be sent.',
    });
  }
}

module.exports = {
  emailCertificate,
  previewCertificate,
};
