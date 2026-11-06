require('dotenv').config();

function getPort() {
  const port = Number(process.env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }

  return port;
}

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173',
  'https://aiskills-iota.vercel.app',
  'https://aiskills-git-master-digital-arts.vercel.app',
];

function getCorsOrigins() {
  const configured = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.includes('*')) {
    return '*';
  }

  return [...new Set([...DEFAULT_CORS_ORIGINS, ...configured])];
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
