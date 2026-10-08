const express = require('express');

const postRoutes = require('./routes/postRoutes');
const controller = require('./controllers/postController');
const { sendError } = require('./utils/http');

function createApp() {
  const app = express();

  app.use(express.json());

  // Public API
  app.use('/posts', postRoutes);

  // Safe internal failure demo route
  app.get('/internal/test-error', controller.explode);

  // Unknown route
  app.use((req, res) => {
    return sendError(
      res,
      404,
      'ROUTE_NOT_FOUND',
      'Route not found'
    );
  });

  // Centralized error handler
  app.use((err, req, res, next) => {
    console.error(err);

    const statusCode =
      Number.isInteger(err.statusCode)
        ? err.statusCode
        : 500;

    if (statusCode >= 500) {
      return sendError(
        res,
        500,
        'INTERNAL_ERROR',
        'Internal server error'
      );
    }

    return sendError(
      res,
      statusCode,
      err.code || 'REQUEST_ERROR',
      err.message || 'Request failed'
    );
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = 5500;

  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

module.exports = {
  createApp
};