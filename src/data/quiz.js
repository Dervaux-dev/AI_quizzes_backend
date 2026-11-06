// ============================================================================
// EDIT THE QUIZ HERE
// ----------------------------------------------------------------------------
// Replace the sample questions below with your real quiz. Each question must
// have a unique `id`, a `prompt`, at least two `options`, and the zero-based
// index of the correct option in `answerIndex`.
//
// Change `passMarkPercent` to set the minimum score (0-100) required to pass.
// ============================================================================
const quiz = {
  title: 'Introduction to Artificial Intelligence (AI)',
  passMarkPercent: 70,
  questions: [
    {
      id: 'q1',
      prompt: 'What does AI stand for?',
      options: [
        'Automated Information',
        'Applied Integration',
        'Artificial Intelligence',
        'Advanced Internet',
      ],
      answerIndex: 2,
    },
    {
      id: 'q2',
      prompt: 'Which of these is a common everyday application of AI?',
      options: [
        'Manual bookkeeping',
        'Voice assistants',
        'Handwritten letters',
        'Paper filing',
      ],
      answerIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'Which of the following is a major branch of AI?',
      options: [
        'Web hosting',
        'Desktop publishing',
        'Network cabling',
        'Machine learning',
      ],
      answerIndex: 3,
    },
    {
      id: 'q4',
      prompt: 'Which of these is an advantage of AI?',
      options: [
        'It never makes mistakes',
        'It can automate repetitive tasks',
        'It requires no data',
        'It replaces human judgement entirely',
      ],
      answerIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'What is a key difference between AI and traditional programming?',
      options: [
        'AI does not use computers',
        'Traditional programs cannot use logic',
        'AI can learn patterns from data',
        'AI never needs testing',
      ],
      answerIndex: 2,
    },
    {
      id: 'q6',
      prompt: 'Which of these is a limitation of AI?',
      options: [
        'It cannot process large datasets',
        'It cannot be used in everyday life',
        'It always explains its decisions',
        'It depends on the quality of its data',
      ],
      answerIndex: 3,
    },
  ],
};

module.exports = { quiz };
