'use strict';

// ─── GIVEN FILE — do not modify ───────────────────────────────────────────────
// Simulated in-memory database with an artificial delay to represent a real DB.

const posts = [
  { id: 1, title: 'Real-time with Socket.IO', score: 94 },
  { id: 2, title: 'Background Jobs with BullMQ', score: 87 },
  { id: 3, title: 'Rate Limiting in Express', score: 81 },
];

let nextId = 4;

/**
 * Simulates a slow database read (100ms delay).
 * In production this would be a complex SQL JOIN with ranking logic.
 */
async function getTrendingPosts() {
  await new Promise(r => setTimeout(r, 100));   // artificial 100ms DB latency
  return [...posts].sort((a, b) => b.score - a.score);
}

/**
 * Creates a new post (fast write).
 */
async function createPost(data) {
  const post = { id: nextId++, title: data.title || 'Untitled', score: 0 };
  posts.push(post);
  return post;
}

module.exports = { getTrendingPosts, createPost };
