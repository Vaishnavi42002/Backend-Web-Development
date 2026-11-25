'use strict';
// app.js — Express application entry point
// Given — do not modify.

require('dotenv').config();

const express     = require('express');
const { passport } = require('./auth/passport');
const authRoutes  = require('./routes/auth');
const postsRoutes = require('./routes/posts');

const app = express();
app.use(express.json());
app.use(passport.initialize());   // register Passport middleware (no sessions)

app.use('/auth',  authRoutes);
app.use('/posts', postsRoutes);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
