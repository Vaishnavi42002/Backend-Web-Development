'use strict';

// ─── GIVEN FILE — do not modify ───────────────────────────────────────────────
require('dotenv').config();

const express = require('express');
const { handleWebhook } = require('./webhookHandler');

const app = express();

// Webhook route registered BEFORE the global json() parser: express.raw()
// must see the untouched request stream to give us req.body as a Buffer.
// If express.json() ran first it would consume the stream and mark the body
// parsed, so raw() would silently no-op (this is Mistake #3 in the mentor
// notes, do not reorder these two).
app.post(
  '/webhooks',
  express.raw({ type: 'application/json' }),
  handleWebhook,
);

// Global JSON parser for all other routes
app.use(express.json());

// Health check: plain JSON, no webhooks
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = { app };
