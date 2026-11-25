'use strict';
// app.js — Express entry point. Given — do not modify.

require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/health', healthRoutes);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Auth API running on http://localhost:${PORT}`));
}

module.exports = app;
