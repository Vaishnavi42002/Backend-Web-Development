const express = require('express');

const postRoutes = require('./routes/postRoutes');
const { resetData } = require('./data/postStore');
const controller = require('./controllers/postController');

function createApp() {
  const app = express();

  // Parse JSON request bodies
  app.use(express.json());

  // Resource-oriented public API
  app.use('/posts', postRoutes);

  // Safe internal route for testing error handling
  app.get('/internal/test-error', controller.explode);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Route not found'
      }
    });
  });

  // Centralized error handler
  app.use((err, req, res, next) => {
    console.error(err);

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
      success: false,
      error: {
        message: err.message || 'Internal Server Error'
      }
    });
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
  createApp,
  resetData
};