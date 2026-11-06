# Certificate API

Express backend for a quiz that generates a personalized PNG certificate with
Sharp and sends it to the participant by email with Nodemailer.

## What it does

1. Serves the quiz questions from `src/data/quiz.js`.
2. Scores the submitted answers.
3. For a passing score, draws the recipient's full name and the current date
   onto `assets/certificate-background.png` using an SVG overlay.
4. Rasterizes the result to PNG with Sharp.
5. Emails the PNG to the participant.

The original template is kept unchanged in `templates/`. The generated
background has the Certificate ID column removed and only the Date of issue and
Institution columns remain.

## Where to put your quiz

Edit the `quiz` object in `src/data/quiz.js`. The file is marked with
`EDIT THE QUIZ HERE` and contains sample questions you can replace.

Each question needs:

- `id` - a unique string
- `prompt` - the question text
- `options` - at least two answer choices
- `answerIndex` - the zero-based index of the correct choice

Set `passMarkPercent` to the minimum percentage required to pass. The quiz is
validated when the server starts, so a malformed question stops startup with a
clear error.

## Project structure

```text
backend/
├── assets/
│   └── certificate-background.png
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── env.js
│   ├── controllers/
│   │   ├── certificate.controller.js
│   │   └── quiz.controller.js
│   ├── data/
│   │   └── quiz.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── routes/
│   │   ├── certificate.routes.js
│   │   ├── index.js
│   │   └── quiz.routes.js
│   ├── services/
│   │   ├── certificate.service.js
│   │   ├── mail.service.js
│   │   └── quiz.service.js
│   └── utils/
│       ├── errors.js
│       └── validation.js
├── templates/
│   └── AI_Certificate_Template_MSGR_MUBILIGI_CATHOLIC_TSS.pdf
└── test/
    ├── certificate.test.js
    ├── quiz.test.js
    └── server.test.js
```

## Run locally

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

Fill in the SMTP values in `.env` before using the email flow. Do not commit
`.env` or expose SMTP credentials to the frontend.

The API listens on port `3001` by default. `CORS_ORIGIN` may contain a
comma-separated list of allowed frontend origins.

## Connect the frontend

The frontend lives in `../frontend` and is already configured to call these
endpoints.

### Development (two servers)

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `http://localhost:3001`,
so the frontend talks to the backend without CORS issues. Leave
`VITE_API_BASE_URL` empty when using this proxy.

### Single server (built frontend)

```bash
cd frontend
npm run build
cd ../backend
npm start
```

Open `http://localhost:3001`. The backend serves `../frontend/dist` and falls
back to `index.html` for client-side routes. Set `FRONTEND_DIST` if the build
output is somewhere else.

## Endpoints

### `GET /api/health`

Health check.

### `GET /api/quiz`

Returns the quiz title, pass mark, questions, and options. Correct answers are
never exposed.

### `POST /api/quiz/submit`

Accepts:

```json
{
  "fullname": "Jane Doe",
  "email": "jane@example.com",
  "role": "Student",
  "answers": {
    "q1": 2,
    "q2": 1,
    "q3": 3,
    "q4": 1,
    "q5": 2,
    "q6": 3
  }
}
```

`answers` may also be an array in question order. A failed quiz returns `200`
with `passed: false` and no email. A passing quiz generates the PNG and emails
it to the participant.

### `POST /api/certificates/preview`

Accepts `{ "fullname": "Jane Doe" }` and returns the generated PNG for preview
without sending an email. The role is used in the email only and is not printed
on the certificate.

## Frontend example

```js
const response = await fetch('http://localhost:3001/api/quiz/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fullname, email, role, answers }),
});

const result = await response.json();
if (!response.ok) {
  throw new Error(result.error);
}
if (!result.passed) {
  console.log(`Score: ${result.percent}% (pass mark ${result.passMarkPercent}%)`);
}
```

For a preview image:

```js
const preview = await fetch('http://localhost:3001/api/certificates/preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fullname }),
});

const pngUrl = URL.createObjectURL(await preview.blob());
```

Revoke preview URLs with `URL.revokeObjectURL(pngUrl)` when they are no longer
needed.
