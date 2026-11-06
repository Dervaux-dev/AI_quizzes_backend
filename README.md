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
│   │   ├── delivery.service.js
│   │   ├── mail.service.js
│   │   └── quiz.service.js
│   └── utils/
│       ├── errors.js
│       └── validation.js
├── scripts/
│   └── send-test-certificate.js
├── templates/
│   └── AI_Certificate_Template_MSGR_MUBILIGI_CATHOLIC_TSS.pdf
└── test/
    ├── certificate.test.js
    ├── mail.test.js
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

## Email delivery

After a passing quiz, the backend sends the certificate PNG with Nodemailer to
the email address entered during registration. The manual download/preview
still works independently.

The certificate screen also has a **Send to email** button (shown as
**Resend to email** after the automatic send). It calls
`POST /api/certificates/email`, so the participant can request the email again
without retaking the quiz. Downloading and emailing use the same generated
certificate layout.

Copy `.env.example` to `.env` and fill in the SMTP values. Common settings:

- Gmail: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`,
  `SMTP_USER=your Gmail address`, `SMTP_PASS=an App Password`.
- Microsoft 365/Outlook: `SMTP_HOST=smtp.office365.com`, `SMTP_PORT=587`,
  `SMTP_SECURE=false`, with the mailbox credentials.
- Zoho: `SMTP_HOST=smtp.zoho.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`.
- School mail server: use the host, port, and credentials from IT.

`MAIL_FROM` must be an address the SMTP server allows you to send from.

Test delivery without taking the quiz:

```bash
npm run email:test -- you@example.com "Jane Doe" "Student"
```

If SMTP is not configured, a passing quiz still returns the result and the
frontend keeps the certificate preview/download available with
`emailSent: false`.

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
with JSON containing `passed: false`. A passing quiz returns the certificate
score as JSON and starts email delivery in the background so SMTP latency does
not block the result. The frontend then requests the certificate preview as a
PNG. When email is not configured, the quiz result still succeeds and its JSON
includes an error message; the participant can still download the certificate.

### `POST /api/certificates/preview`

Accepts `{ "fullname": "Jane Doe" }` and returns the generated PNG for preview
without sending an email. The role is used in the email only and is not printed
on the certificate.

### `POST /api/certificates/email`

Accepts `{ "fullname": "Jane Doe", "email": "jane@example.com", "role": "Student" }`
and generates the certificate with the same layout as the preview, then emails
it to the given address:

```json
{ "status": "sent", "messageId": "<...>" }
```

Returns `503` when SMTP is not configured and `502` when delivery fails. This
endpoint is used by the certificate screen's **Send to email** button and can
also be called directly to resend a certificate.

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
if (result.passed) {
  const preview = await fetch('http://localhost:3001/api/certificates/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullname }),
  });
  const certificateUrl = URL.createObjectURL(await preview.blob());
  // Display or download certificateUrl; revoke it when no longer needed.
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

To send or resend the certificate email:

```js
const emailResponse = await fetch(
  'http://localhost:3001/api/certificates/email',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullname, email, role }),
  },
);

const emailResult = await emailResponse.json();
if (!emailResponse.ok) {
  throw new Error(emailResult.error);
}
```
