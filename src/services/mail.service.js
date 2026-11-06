const nodemailer = require('nodemailer');
const { getMailConfig } = require('../config/env');

function isConfigured(config = getMailConfig()) {
  return Boolean(
    config.host
    && config.user
    && config.pass
    && config.from
    && Number.isInteger(config.port)
    && config.port > 0
    && config.port <= 65535,
  );
}

function escapeHtml(value) {
  return String(value).replace(/[<>&'"]/gu, (character) => {
    switch (character) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&#39;';
      default:
        return '&quot;';
    }
  });
}

function createMailer({ transporter } = {}) {
  return {
    isConfigured() {
      return isConfigured();
    },

    async sendCertificate({
      to,
      fullname,
      role,
      date,
      courseTitle,
      png,
    }) {
      const config = getMailConfig();
      if (!isConfigured(config)) {
        throw new Error('Email is not configured.');
      }

      const transport = transporter
        || nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: { user: config.user, pass: config.pass },
        });

      const safeName = escapeHtml(fullname);
      const safeRole = escapeHtml(role);
      const safeCourse = escapeHtml(courseTitle);

      return transport.sendMail({
        from: config.from,
        to,
        subject: 'Your Certificate of Participation',
        text: [
          `Hello ${fullname},`,
          '',
          `Congratulations on completing "${courseTitle}" as ${role}.`,
          `Your certificate is attached to this email and is dated ${date}.`,
          '',
          'MSGR. F. MUBILIGI CATHOLIC TSS',
        ].join('\n'),
        html: `
          <div style="font-family: Arial, Helvetica, sans-serif; color: #18355f; line-height: 1.6;">
            <p>Hello ${safeName},</p>
            <p>
              Congratulations on completing <strong>${safeCourse}</strong>
              as <strong>${safeRole}</strong>.
            </p>
            <p>Your certificate is attached to this email and is dated ${escapeHtml(date)}.</p>
            <p style="margin-top: 24px;">MSGR. F. MUBILIGI CATHOLIC TSS</p>
          </div>
        `,
        attachments: [{
          filename: 'certificate-of-participation.png',
          content: png,
          contentType: 'image/png',
        }],
      });
    },
  };
}

const defaultMailer = createMailer();

module.exports = {
  createMailer,
  defaultMailer,
  isConfigured,
};
