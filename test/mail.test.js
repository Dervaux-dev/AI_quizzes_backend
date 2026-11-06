const assert = require('node:assert/strict');
const test = require('node:test');
const nodemailer = require('nodemailer');
const { createMailer } = require('../src/services/mail.service');
const { quiz } = require('../src/services/quiz.service');

const MAIL_ENV_KEYS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM',
];

function saveMailEnv() {
  return new Map(MAIL_ENV_KEYS.map((key) => [key, process.env[key]]));
}

function restoreMailEnv(previous) {
  for (const key of MAIL_ENV_KEYS) {
    const value = previous.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function configureMailEnv() {
  process.env.SMTP_HOST = 'smtp.example.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_USER = 'sender@example.com';
  process.env.SMTP_PASS = 'secret';
  process.env.MAIL_FROM = 'Certificates <sender@example.com>';
}

test('sends the certificate PNG to the registered email', async () => {
  const previous = saveMailEnv();
  configureMailEnv();

  try {
    const messages = [];
    const transporter = {
      async sendMail(options) {
        messages.push(options);
        return { messageId: 'test-message' };
      },
    };
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const mailer = createMailer({ transporter });

    const info = await mailer.sendCertificate({
      to: 'jane@example.com',
      fullname: 'Jane Doe',
      role: 'Student',
      date: '06 November 2026',
      courseTitle: quiz.title,
      png,
    });

    assert.equal(info.messageId, 'test-message');
    assert.equal(messages.length, 1);

    const [message] = messages;
    assert.equal(message.to, 'jane@example.com');
    assert.equal(message.from, 'Certificates <sender@example.com>');
    assert.match(message.text, /Jane Doe/u);
    assert.match(message.text, /Student/u);
    assert.match(message.html, /Jane Doe/u);
    assert.equal(
      message.attachments[0].filename,
      'certificate-of-participation.png',
    );
    assert.equal(message.attachments[0].contentType, 'image/png');
    assert.ok(message.attachments[0].content.equals(png));
  } finally {
    restoreMailEnv(previous);
  }
});

test('detects missing SMTP configuration', () => {
  const previous = saveMailEnv();
  MAIL_ENV_KEYS.forEach((key) => delete process.env[key]);

  try {
    const mailer = createMailer();
    assert.equal(mailer.isConfigured(), false);
  } finally {
    restoreMailEnv(previous);
  }
});

test('reuses a pooled SMTP transport for subsequent emails', async () => {
  const previous = saveMailEnv();
  const originalCreateTransport = nodemailer.createTransport;
  configureMailEnv();

  let createCount = 0;
  let sendCount = 0;
  let transportOptions;
  nodemailer.createTransport = (options) => {
    createCount += 1;
    transportOptions = options;
    return {
      async sendMail() {
        sendCount += 1;
        return { messageId: `message-${sendCount}` };
      },
    };
  };

  try {
    const mailer = createMailer();
    const message = {
      to: 'jane@example.com',
      fullname: 'Jane Doe',
      role: 'Student',
      date: '06 November 2026',
      courseTitle: quiz.title,
      png: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    };

    await mailer.sendCertificate(message);
    await mailer.sendCertificate(message);

    assert.equal(createCount, 1);
    assert.equal(sendCount, 2);
    assert.equal(transportOptions.pool, true);
    assert.equal(transportOptions.maxConnections, 2);
    assert.equal(transportOptions.connectionTimeout, 10_000);
    assert.equal(transportOptions.greetingTimeout, 10_000);
    assert.equal(transportOptions.socketTimeout, 30_000);
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    restoreMailEnv(previous);
  }
});
