require('dotenv').config();
const express = require('express');
const requireAuth = require('./middleware/requireAuth');
const { signToken } = require('./utils/jwt');

const app = express();
app.use(express.json());

// Public
app.post('/auth/login', (req, res) => {
  const token = signToken({ sub: req.body.sub || 'user-1' });
  return res.status(200).json({ token });
});

// Protected
app.get('/profile', requireAuth, (req, res) => {
  return res.status(200).json({ userId: req.user.sub });
});

app.get('/posts/my', requireAuth, (req, res) => {
  return res.status(200).json({ userId: req.user.sub, posts: [] });
});

// Error handler
app.use((error, req, res, next) => {
  console.error(error.message);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`LU 51.1 starter on ${port}`));

module.exports = app;
