'use strict';
// data.js — in-memory user store (replaces a database for this assignment)
//
// Three users are pre-seeded to cover the three OAuth scenarios you must handle:
//
//   u-1  alice@gmail.com   has NO googleId (local account) — link test
//   u-2  bob@gmail.com     has a googleId already set      — returning OAuth user test
//   u-3  admin@thread.io   admin role, local only          — role preservation test
//
// Do NOT modify this file.

let _counter = 3;

/** Returns a unique id string for a new user, e.g. 'u-4'. */
function nextId() {
  return 'u-' + (++_counter);
}

const users = [
  {
    id:       'u-1',
    email:    'alice@gmail.com',
    name:     'Alice (local)',
    role:     'member',
    googleId: null,          // will be linked when Alice first uses Google login
  },
  {
    id:       'u-2',
    email:    'bob@gmail.com',
    name:     'Bob',
    role:     'moderator',
    googleId: 'google-sub-bob-999',   // already linked — returning OAuth user
  },
  {
    id:       'u-3',
    email:    'admin@thread.io',
    name:     'Admin',
    role:     'admin',
    googleId: null,
  },
];

module.exports = { users, nextId };
