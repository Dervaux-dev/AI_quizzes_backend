const { quiz } = require('../data/quiz');

function normalizeAnswers(answers) {
  if (Array.isArray(answers)) {
    return Object.fromEntries(
      quiz.questions.map((question, index) => [question.id, answers[index]]),
    );
  }

  if (answers && typeof answers === 'object') {
    return answers;
  }

  return null;
}

function toAnswerIndex(value) {
  if (Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/u.test(value.trim())) {
    return Number(value.trim());
  }

  return null;
}

function scoreQuiz(answers) {
  const submitted = normalizeAnswers(answers);
  if (!submitted) {
    throw new TypeError('Quiz answers must be an object or an array.');
  }

  let score = 0;
  for (const question of quiz.questions) {
    if (toAnswerIndex(submitted[question.id]) === question.answerIndex) {
      score += 1;
    }
  }

  const total = quiz.questions.length;
  const percent = Math.round((score / total) * 100);

  return {
    score,
    total,
    percent,
    passMarkPercent: quiz.passMarkPercent,
    passed: percent >= quiz.passMarkPercent,
  };
}

function getPublicQuiz() {
  return {
    title: quiz.title,
    passMarkPercent: quiz.passMarkPercent,
    questions: quiz.questions.map(({ id, prompt, options }) => ({
      id,
      prompt,
      options: [...options],
    })),
  };
}

function assertQuizIsValid(definition = quiz) {
  if (!definition || typeof definition !== 'object') {
    throw new Error('The quiz definition must be an object.');
  }
  if (typeof definition.title !== 'string' || !definition.title.trim()) {
    throw new Error('The quiz must have a title.');
  }
  if (
    !Number.isFinite(definition.passMarkPercent)
    || definition.passMarkPercent < 0
    || definition.passMarkPercent > 100
  ) {
    throw new Error('passMarkPercent must be a number between 0 and 100.');
  }
  if (!Array.isArray(definition.questions) || definition.questions.length === 0) {
    throw new Error('The quiz must contain at least one question.');
  }

  const ids = new Set();
  definition.questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;

    if (typeof question.id !== 'string' || !question.id.trim()) {
      throw new Error(`${label} must have a non-empty id.`);
    }
    if (ids.has(question.id)) {
      throw new Error(`${label} has a duplicate id: ${question.id}.`);
    }
    ids.add(question.id);

    if (typeof question.prompt !== 'string' || !question.prompt.trim()) {
      throw new Error(`${label} must have a prompt.`);
    }
    if (!Array.isArray(question.options) || question.options.length < 2) {
      throw new Error(`${label} must have at least two options.`);
    }
    if (
      !question.options.every(
        (option) => typeof option === 'string' && option.trim(),
      )
    ) {
      throw new Error(`${label} options must be non-empty strings.`);
    }
    if (
      !Number.isInteger(question.answerIndex)
      || question.answerIndex < 0
      || question.answerIndex >= question.options.length
    ) {
      throw new Error(`${label} has an invalid answerIndex.`);
    }
  });
}

module.exports = {
  assertQuizIsValid,
  getPublicQuiz,
  normalizeAnswers,
  quiz,
  scoreQuiz,
};
