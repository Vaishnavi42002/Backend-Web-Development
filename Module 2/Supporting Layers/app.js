const express = require('express');
const articlesRouter = require('./routes/articles');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config');

const app = express();

app.use(express.json());

app.use('/articles', articlesRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(
    `articles-api listening on http://localhost:${config.port}`
  );
});

module.exports = app;