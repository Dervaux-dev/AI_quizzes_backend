function notFound(_request, response) {
  response.status(404).json({ error: 'Not found.' });
}

module.exports = notFound;
