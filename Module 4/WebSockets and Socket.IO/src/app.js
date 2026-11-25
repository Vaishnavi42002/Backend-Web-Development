'use strict';

// ─── GIVEN FILE, do not modify ───────────────────────────────────────────────
// This file creates the shared HTTP server, mounts Express, attaches Socket.IO
// via initSocket(), and starts listening. Your work goes in src/socket.js.

const express       = require('express');
const http          = require('node:http');
const path          = require('node:path');
const { initSocket } = require('./socket');

const app        = express();
const httpServer = http.createServer(app);

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check, not rate-limited, not socket-involved
app.get('/health', (req, res) => res.json({ ok: true }));

// Attach Socket.IO and expose io for REST handlers if needed
const io = initSocket(httpServer);  // students implement this

const PORT = process.env.PORT || 3000;

// Only listen when run directly (not imported by tests)
if (require.main === module) {
  httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = { app, httpServer, io };
