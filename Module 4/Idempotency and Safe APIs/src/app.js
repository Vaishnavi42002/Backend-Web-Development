'use strict';
// app.js — Express entry point. Given — do not modify.

require('dotenv').config();
const express = require('express');
const payments = require('./routes/payments');
const debug = require('./routes/debug');

const app = express();
app.use(express.json());
app.use('/payments', payments);
app.use('/_debug', debug);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Payments API running on http://localhost:${PORT}`));
}

module.exports = app;
