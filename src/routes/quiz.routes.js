const { Router } = require('express');
const { getQuiz, submitQuiz } = require('../controllers/quiz.controller');

const router = Router();

router.get('/', getQuiz);
router.post('/submit', submitQuiz);

module.exports = router;
