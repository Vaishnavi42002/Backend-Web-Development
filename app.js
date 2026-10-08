const express = require('express');

const postRoutes =
  require('./routes/postRoutes');

const { resetData } =
  require('./data/postStore');

const controller =
  require('./controllers/postController');

const { sendError } =
  require('./utils/http');


function createApp() {
  const app = express();

  // Parse JSON
  app.use(express.json());


  // Public resource API
  app.use('/posts', postRoutes);


  // Internal test route
  // Used only to demonstrate safe
  // centralized error handling.
  app.get(
    '/internal/test-error',
    controller.explode
  );


  // 404 - Route does not exist
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

    // Log complete error internally
    console.error(err);


    const statusCode =
      Number.isInteger(err.statusCode)
        ? err.statusCode
        : 500;


    // Never expose internal details
    // for server errors.
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
    console.log(
      `API listening on port ${port}`
    );
  });
}


module.exports = {
  createApp,
  resetData
};