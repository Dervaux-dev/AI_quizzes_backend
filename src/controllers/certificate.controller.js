const { generateCertificatePng } = require('../services/certificate.service');
const { sendCertificateEmail } = require('../services/delivery.service');
const {
  validateEmail,
  validateFullname,
  validateRole,
} = require('../utils/validation');

function getEmailFailureMessage(code) {
  switch (code) {
    case 'EAUTH':
      return 'SMTP rejected authentication. Check the credentials configured on the backend.';
    case 'EENVELOPE':
      return 'SMTP rejected the sender or recipient address. Check MAIL_FROM and the recipient address.';
    case 'ETIMEDOUT':
    case 'ECONNECTION':
    case 'ESOCKET':
      return 'The backend could not complete its SMTP connection. Check the SMTP host, port, TLS settings, and network access.';
    case 'EMESSAGE':
      return 'The SMTP provider rejected the email content or attachment.';
    default:
      return 'The SMTP provider did not accept the email. Check the backend logs for the SMTP error.';
  }
}

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
    const code = typeof error?.code === 'string'
      ? error.code
      : 'EMAIL_SEND_FAILED';
    console.error('Certificate email delivery failed:', {
      code,
      command: error?.command,
      responseCode: error?.responseCode,
    });
    return response.status(502).json({
      status: 'not_sent',
      code,
      error: getEmailFailureMessage(code),
    });
  }
}

module.exports = {
  emailCertificate,
  previewCertificate,
};
