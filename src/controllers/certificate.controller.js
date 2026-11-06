const { generateCertificatePng } = require('../services/certificate.service');
const { validateFullname } = require('../utils/validation');

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

module.exports = { previewCertificate };
