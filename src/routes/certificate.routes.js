const { Router } = require('express');
const {
  previewCertificate,
} = require('../controllers/certificate.controller');

const router = Router();

router.post('/preview', previewCertificate);

module.exports = router;
