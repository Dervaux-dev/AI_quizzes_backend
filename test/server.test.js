const assert = require('node:assert/strict');
const fs = require('node:fs');
const { once } = require('node:events');
const path = require('node:path');
const test = require('node:test');
const { createApp } = require('../src/app');
const { getCorsOrigins } = require('../src/config/env');
const { quiz } = require('../src/services/quiz.service');

const frontendIndex = path.join(
  __dirname,
  '..',
  '..',
  'frontend',
  'dist',
  'index.html',
);

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const correctAnswers = Object.fromEntries(
  quiz.questions.map((question) => [question.id, question.answerIndex]),
);

function createFakeMailer({
  configured = true,
  fail = false,
  sent = [],
  delayMs = 0,
} = {}) {
  return {
    isConfigured() {
      return configured;
    },
    async sendCertificate(payload) {
      if (delayMs) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (fail) {
        throw new Error('SMTP unavailable');
      }
      sent.push(payload);
      return { messageId: 'test-message' };
    },
  };
}

async function withServer(app, callback) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function postJson(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function waitFor(predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;

  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for condition.');
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

test('allows the deployed frontend origins by default', () => {
  const previous = process.env.CORS_ORIGIN;
  delete process.env.CORS_ORIGIN;

  try {
    const origins = getCorsOrigins();
    assert.ok(origins.includes('https://aiskills-iota.vercel.app'));
    assert.ok(
      origins.includes('https://aiskills-git-master-digital-arts.vercel.app'),
    );
  } finally {
    if (previous === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = previous;
    }
  }
});

test('merges CORS_ORIGIN into the default origins', () => {
  const previous = process.env.CORS_ORIGIN;
  process.env.CORS_ORIGIN = 'https://example.com, https://second.example.com';

  try {
    const origins = getCorsOrigins();
    assert.ok(origins.includes('https://example.com'));
    assert.ok(origins.includes('https://second.example.com'));
    assert.ok(origins.includes('https://aiskills-iota.vercel.app'));
  } finally {
    if (previous === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = previous;
    }
  }
});

test('supports a wildcard CORS origin', () => {
  const previous = process.env.CORS_ORIGIN;
  process.env.CORS_ORIGIN = '*';

  try {
    assert.equal(getCorsOrigins(), '*');
  } finally {
    if (previous === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = previous;
    }
  }
});

test('health and quiz endpoints respond correctly', async () => {
  await withServer(createApp({ mailer: createFakeMailer() }), async (baseUrl) => {
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok' });

    const quizResponse = await fetch(`${baseUrl}/api/quiz`);
    assert.equal(quizResponse.status, 200);

    const publicQuiz = await quizResponse.json();
    assert.equal(publicQuiz.questions.length, quiz.questions.length);
    assert.equal(publicQuiz.questions[0].answerIndex, undefined);
  });
});

test('rejects invalid certificate input', async () => {
  await withServer(createApp({ mailer: createFakeMailer() }), async (baseUrl) => {
    const missingName = await postJson(`${baseUrl}/api/quiz/submit`, {
      fullname: '',
      email: 'jane@example.com',
      role: 'Student',
      answers: correctAnswers,
    });
    assert.equal(missingName.status, 400);

    const invalidEmail = await postJson(`${baseUrl}/api/quiz/submit`, {
      fullname: 'Jane Doe',
      email: 'not-an-email',
      role: 'Student',
      answers: correctAnswers,
    });
    assert.equal(invalidEmail.status, 400);

    const missingAnswers = await postJson(`${baseUrl}/api/quiz/submit`, {
      fullname: 'Jane Doe',
      email: 'jane@example.com',
      role: 'Student',
    });
    assert.equal(missingAnswers.status, 400);

    const invalidCertificateEmail = await postJson(
      `${baseUrl}/api/certificates/email`,
      {
        fullname: 'Jane Doe',
        email: 'not-an-email',
        role: 'Student',
      },
    );
    assert.equal(invalidCertificateEmail.status, 400);
  });
});

test('does not email a certificate when the quiz is failed', async () => {
  const sent = [];
  await withServer(
    createApp({ mailer: createFakeMailer({ sent }) }),
    async (baseUrl) => {
      const response = await postJson(`${baseUrl}/api/quiz/submit`, {
        fullname: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Student',
        answers: {},
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.passed, false);
      assert.equal(body.emailSent, false);
      assert.equal(sent.length, 0);
    },
  );
});

test('generates and emails a certificate after a passing quiz', async () => {
  const sent = [];
  await withServer(
    createApp({ mailer: createFakeMailer({ sent }) }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://aiskills-iota.vercel.app',
        },
        body: JSON.stringify({
          fullname: 'Jane Doe',
          email: 'jane@example.com',
          role: 'Student',
          answers: correctAnswers,
        }),
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /application\/json/u);
      assert.equal(body.passed, true);
      assert.equal(body.emailSent, false);
      assert.equal(body.emailQueued, true);

      await waitFor(() => sent.length === 1);
      assert.equal(sent.length, 1);

      const [payload] = sent;
      assert.equal(payload.to, 'jane@example.com');
      assert.equal(payload.fullname, 'Jane Doe');
      assert.equal(payload.role, 'Student');
      assert.equal(payload.courseTitle, quiz.title);
      assert.match(payload.date, /^\d{2} [A-Z][a-z]+ \d{4}$/u);
      assert.ok(Buffer.isBuffer(payload.png));
      assert.ok(payload.png.subarray(0, 8).equals(PNG_SIGNATURE));
    },
  );
});

test('reports missing email configuration after a passing quiz', async () => {
  await withServer(
    createApp({ mailer: createFakeMailer({ configured: false }) }),
    async (baseUrl) => {
      const response = await postJson(`${baseUrl}/api/quiz/submit`, {
        fullname: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Student',
        answers: correctAnswers,
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /application\/json/u);
      assert.equal(body.passed, true);
      assert.equal(body.emailSent, false);
      assert.equal(body.emailQueued, false);
      assert.match(body.error, /Email is not configured/u);
    },
  );
});

test('returns the certificate without waiting for slow email delivery', async () => {
  const sent = [];
  await withServer(
    createApp({ mailer: createFakeMailer({ sent, delayMs: 2000 }) }),
    async (baseUrl) => {
      const startedAt = Date.now();
      const response = await postJson(`${baseUrl}/api/quiz/submit`, {
        fullname: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Student',
        answers: correctAnswers,
      });
      const body = await response.json();

      assert.ok(Date.now() - startedAt < 1800);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /application\/json/u);
      assert.equal(body.passed, true);
      assert.equal(body.emailQueued, true);

      await waitFor(() => sent.length === 1);
    },
  );
});

test('returns a PNG certificate preview', async () => {
  await withServer(createApp({ mailer: createFakeMailer() }), async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/certificates/preview`, {
      fullname: 'Jane Doe',
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /image\/png/u);

    const png = Buffer.from(await response.arrayBuffer());
    assert.ok(png.subarray(0, 8).equals(PNG_SIGNATURE));
  });
});

test('emails a certificate on demand from the certificate screen', async () => {
  const sent = [];
  await withServer(
    createApp({ mailer: createFakeMailer({ sent }) }),
    async (baseUrl) => {
      const response = await postJson(`${baseUrl}/api/certificates/email`, {
        fullname: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Student',
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.status, 'sent');
      assert.equal(body.messageId, 'test-message');
      assert.equal(sent.length, 1);

      const [payload] = sent;
      assert.equal(payload.to, 'jane@example.com');
      assert.equal(payload.fullname, 'Jane Doe');
      assert.equal(payload.role, 'Student');
      assert.ok(Buffer.isBuffer(payload.png));
      assert.ok(payload.png.subarray(0, 8).equals(PNG_SIGNATURE));
    },
  );
});

test('reports certificate email configuration and delivery failures', async () => {
  await withServer(
    createApp({ mailer: createFakeMailer({ configured: false }) }),
    async (baseUrl) => {
      const response = await postJson(`${baseUrl}/api/certificates/email`, {
        fullname: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Student',
      });
      const body = await response.json();

      assert.equal(response.status, 503);
      assert.equal(body.status, 'not_sent');
    },
  );

  await withServer(
    createApp({ mailer: createFakeMailer({ fail: true }) }),
    async (baseUrl) => {
      const response = await postJson(`${baseUrl}/api/certificates/email`, {
        fullname: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Student',
      });
      const body = await response.json();

      assert.equal(response.status, 502);
      assert.equal(body.status, 'not_sent');
    },
  );
});

test(
  'serves the built frontend when it is available',
  { skip: !fs.existsSync(frontendIndex) },
  async () => {
    await withServer(
      createApp({ mailer: createFakeMailer() }),
      async (baseUrl) => {
        const home = await fetch(`${baseUrl}/`);
        assert.equal(home.status, 200);
        assert.match(home.headers.get('content-type'), /text\/html/u);
        assert.match(await home.text(), /<div id="root"><\/div>/u);

        const clientRoute = await fetch(`${baseUrl}/quiz`);
        assert.equal(clientRoute.status, 200);
        assert.match(clientRoute.headers.get('content-type'), /text\/html/u);
      },
    );
  },
);

test('returns a JSON 404 for unknown routes', async () => {
  await withServer(createApp({ mailer: createFakeMailer() }), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/unknown`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Not found.' });
  });
});
