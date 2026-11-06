require('dotenv').config();

function getPort() {
  const port = Number(process.env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }

  return port;
}

function getCorsOrigins() {
  return (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getMailConfig() {
  const user = process.env.SMTP_USER?.trim() || '';
  const from = (process.env.MAIL_FROM || user).trim();

  return {
    host: process.env.SMTP_HOST?.trim() || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user,
    pass: process.env.SMTP_PASS || '',
    from,
  };
}

module.exports = {
  getCorsOrigins,
  getMailConfig,
  getPort,
};
