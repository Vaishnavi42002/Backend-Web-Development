'use strict';

// ─── GIVEN FILE, do not modify ───────────────────────────────────────────────
// nodemailer transporter using Ethereal SMTP credentials from .env
// For a test account: https://ethereal.email/create
// Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

module.exports = { transporter };
