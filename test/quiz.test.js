const assert = require('node:assert/strict');
const test = require('node:test');
const {
  assertQuizIsValid,
  getPublicQuiz,
  quiz,
  scoreQuiz,
} = require('../src/services/quiz.service');

const correctAnswers = Object.fromEntries(
  quiz.questions.map((question) => [question.id, question.answerIndex]),
);

test('the hardcoded quiz definition is valid', () => {
  assert.doesNotThrow(() => assertQuizIsValid());
});

test('the public quiz does not expose correct answers', () => {
  const publicQuiz = getPublicQuiz();

  assert.equal(publicQuiz.title, quiz.title);
  assert.equal(publicQuiz.questions.length, quiz.questions.length);
  for (const question of publicQuiz.questions) {
    assert.equal(question.answerIndex, undefined);
    assert.ok(Array.isArray(question.options));
  }
});

test('scores a fully correct submission as passed', () => {
  const result = scoreQuiz(correctAnswers);

  assert.equal(result.score, quiz.questions.length);
  assert.equal(result.total, quiz.questions.length);
  assert.equal(result.percent, 100);
  assert.equal(result.passed, true);
});

test('scores an empty submission as failed', () => {
  const result = scoreQuiz({});

  assert.equal(result.score, 0);
  assert.equal(result.passed, false);
});

test('accepts answers in question order as an array', () => {
  const answers = quiz.questions.map((question) => question.answerIndex);
  const result = scoreQuiz(answers);

  assert.equal(result.score, quiz.questions.length);
  assert.equal(result.passed, true);
});

test('rejects missing answers', () => {
  assert.throws(() => scoreQuiz(null), TypeError);
});
