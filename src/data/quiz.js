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
      prompt: 'Which of these is an AI tool a student can use to ask questions and get help?',
      options: [
        'ChatGPT',
        'A keyboard',
        'A handwritten letter',
        'A paper filing cabinet',
      ],
      answerIndex: 0,
    },
    {
      id: 'q3',
      prompt: 'How can AI help students with their learning?',
      options: [
        'Explain topics and help organize ideas for study',
        'Guarantee a correct answer to every question',
        'Replace the need to learn the subject',
        'Complete every assignment without student review',
      ],
      answerIndex: 0,
    },
    {
      id: 'q4',
      prompt: 'Which of these AI tools can help students explore a research question and find sources?',
      options: [
        'Perplexity AI',
        'A basic calculator',
        'A drawing program',
        'A paper filing cabinet',
      ],
      answerIndex: 0,
    },
    {
      id: 'q5',
      prompt: 'When using AI to help with a school assignment, what should a student do?',
      options: [
        'Copy the answer without checking it',
        'Check important claims and explain the ideas in their own words',
        'Assume every source suggested by AI is reliable',
        'Share private information to get a more personal answer',
      ],
      answerIndex: 1,
    },
    {
      id: 'q6',
      prompt: 'Why should students review information provided by an AI tool?',
      options: [
        'AI tools cannot help with learning or research',
        'AI tools only work when a teacher is present',
        'AI can provide inaccurate or outdated information',
        'AI always uses the same sources for every answer',
      ],
      answerIndex: 2,
    },
  ],
};

module.exports = { quiz };
