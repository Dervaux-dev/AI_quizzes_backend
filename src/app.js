const fs = require('node:fs');
const path = require('node:path');
const cors = require('cors');
const express = require('express');
const { getCorsOrigins } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const routes = require('./routes');
const { defaultMailer } = require('./services/mail.service');

const FRONTEND_DIST = process.env.FRONTEND_DIST
  ? path.resolve(process.env.FRONTEND_DIST)
  : path.resolve(__dirname, '..', '..', 'frontend', 'dist');
const FRONTEND_INDEX = path.join(FRONTEND_DIST, 'index.html');

function mountFrontend(app) {
  if (!fs.existsSync(FRONTEND_INDEX)) {
    return;
  }

  app.use(express.static(FRONTEND_DIST));
  app.use((request, response, next) => {
    if (request.method !== 'GET' || request.path.startsWith('/api')) {
      return next();
    }

    return response.sendFile(FRONTEND_INDEX);
  });
}

function createApp({ mailer = defaultMailer } = {}) {
  const app = express();

  app.locals.mailer = mailer;
  app.use(cors({
    origin: getCorsOrigins(),
    exposedHeaders: ['X-Quiz-Result'],
  }));
  app.use(express.json({ limit: '10kb' }));
  app.use('/api', routes);
  mountFrontend(app);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

const app = createApp();

module.exports = { app, createApp };
