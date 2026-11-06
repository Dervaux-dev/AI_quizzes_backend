const { app } = require('./app');
const { getPort } = require('./config/env');
const {
  assertCertificateBackgroundExists,
} = require('./services/certificate.service');
const { assertQuizIsValid } = require('./services/quiz.service');

async function startServer() {
  await assertCertificateBackgroundExists();
  assertQuizIsValid();

  const port = getPort();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Certificate API listening on port ${port}`);
      resolve(server);
    });

    server.on('error', reject);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Could not start the certificate API:', error);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
