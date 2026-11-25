'use strict';

// ─── YOUR FILE — implement this ───────────────────────────────────────────────
// Implement three Redis helper functions using ioredis.
//
// cacheGet(key)
//   - redis.get(key) → string | null
//   - If string: JSON.parse and return the object
//   - If null: return null (cache miss)
//   - Wrap in try/catch: on error, log and return null (graceful degradation)
//
// cacheSet(key, data, ttlSeconds)
//   - redis.set(key, JSON.stringify(data), 'EX', ttlSeconds)
//   - Wrap in try/catch: on error, log (don't fail the request)
//
// cacheDel(key)
//   - redis.del(key)
//   - Wrap in try/catch: on error, log
//
// Redis connection:
//   host: process.env.REDIS_HOST || 'localhost'
//   port: parseInt(process.env.REDIS_PORT || '6379')
//   lazyConnect: true

const Redis = require('ioredis');

// TODO: create Redis instance

// TODO: implement cacheGet
async function cacheGet(key) {
  throw new Error('not implemented');
}

// TODO: implement cacheSet
async function cacheSet(key, data, ttlSeconds) {
  throw new Error('not implemented');
}

// TODO: implement cacheDel
async function cacheDel(key) {
  throw new Error('not implemented');
}

module.exports = { cacheGet, cacheSet, cacheDel };
