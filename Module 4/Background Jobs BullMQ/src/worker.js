'use strict';

// ─── YOUR FILE, implement this ───────────────────────────────────────────────
// Create a BullMQ Worker that processes jobs from the 'email' queue.
//
// Requirements:
//  1. Handle job.name === 'otp': send an email with the OTP using transporter.
//  2. Configure retries: attempts: 3, backoff: { type: 'exponential', delay: 1000 }
//  3. Log worker.on('completed') and worker.on('failed') events.
//  4. Throwing inside the worker function → job fails → BullMQ retries.
//     Returning without throwing → job completed.

// TODO: implement
