const { InputError } = require('../utils/errors');

function errorHandler(error, _request, response, _next) {
  if (error instanceof InputError) {
    return response.status(400).json({ error: error.message });
  }

  console.error('Request failed:', error);
  return response.status(500).json({
    error: 'An unexpected server error occurred.',
  });
}

module.exports = errorHandler;
