const { Router } = require('express');
const {
  emailCertificate,
  previewCertificate,
} = require('../controllers/certificate.controller');

const router = Router();

router.post('/preview', previewCertificate);
router.post('/email', emailCertificate);

module.exports = router;
