'use strict';

// ─── GIVEN FILE, do not modify ───────────────────────────────────────────────
require('dotenv').config();

const express = require('express');
const { emailQueue } = require('./queue');
const { generateOTP, storeOTP, verifyOTP, markVerified } = require('./otpStore');

// Worker is started by requiring it, runs as long as the process is alive
require('./worker');

const app = express();
app.use(express.json());

// POST /auth/request-verification
// Generates a 6-digit OTP, stores it, and enqueues an email job.
// Returns 200 immediately, the email is sent asynchronously by the worker.
app.post('/auth/request-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const otp = generateOTP();
    storeOTP(email, otp);
    await emailQueue.add('otp', { to: email, otp });

    res.json({ message: 'Verification email sent. Check your inbox for the OTP.' });
  } catch (err) {
    console.error('request-verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/verify-otp
// Verifies the OTP submitted by the user.
// Returns 200 on success, or 401/410/429 on failure.
app.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'email and otp are required' });

    const result = verifyOTP(email, otp);

    if (!result.ok) {
      const statusMap = {
        not_found:        401,
        wrong_code:       401,
        expired:          410,
        too_many_attempts: 429,
      };
      return res.status(statusMap[result.reason] || 400).json({ error: result.reason });
    }

    markVerified(email);
    res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = { app };
