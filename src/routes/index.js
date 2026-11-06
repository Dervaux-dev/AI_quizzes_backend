const { Router } = require('express');
const certificateRoutes = require('./certificate.routes');
const quizRoutes = require('./quiz.routes');

const router = Router();

router.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});
router.use('/quiz', quizRoutes);
router.use('/certificates', certificateRoutes);

module.exports = router;
