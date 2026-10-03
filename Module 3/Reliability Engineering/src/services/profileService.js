const DEFAULT_AVATAR = {
  url: 'https://cdn.aurora-profiles.dev/avatars/default.png',
  initials: '?',
  source: 'fallback',
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryable(error) {
  // Retry:
  // 1. AbortError
  // 2. HTTP 429
  // 3. HTTP 5xx
  // 4. Network errors
  //
  // Do NOT retry normal 4xx errors.

  if (!error) {
    return false;
  }

  // Timeout / AbortError
  if (error.name === 'AbortError') {
    return true;
  }

  // HTTP status errors
  const status = error.status ?? error.statusCode;

  if (status === 429) {
    return true;
  }

  if (status >= 500 && status <= 599) {
    return true;
  }

  // Network errors
  const networkCodes = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ECONNABORTED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'EPIPE',
    'ENETUNREACH',
    'EHOSTUNREACH'
  ];

  if (networkCodes.includes(error.code)) {
    return true;
  }

  // Some clients use a generic "network" type
  if (error.type === 'network') {
    return true;
  }

  return false;
}

async function withTimeout(operation, timeoutMs) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await operation(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function withRetry(operation, options = {}) {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 25;

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Do not retry non-retryable errors
      if (!isRetryable(error)) {
        throw error;
      }

      // Last attempt failed
      if (attempt === maxAttempts - 1) {
        throw error;
      }

      // Exponential backoff:
      // attempt 0 -> baseDelayMs
      // attempt 1 -> baseDelayMs * 2
      // attempt 2 -> baseDelayMs * 4
      const delay = baseDelayMs * 2 ** attempt;

      await sleep(delay);
    }
  }

  throw lastError;
}

async function getProfileWithAvatar(
  authorId,
  avatarClient,
  options = {}
) {
  const timeoutMs = options.timeoutMs ?? 200;
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 25;

  try {
    const avatar = await withRetry(
      signal =>
        withTimeout(
          currentSignal =>
            avatarClient.getAvatar(
              authorId,
              currentSignal
            ),
          timeoutMs
        ),
      {
        maxAttempts,
        baseDelayMs
      }
    );

    return {
      authorId,
      avatar,
      degraded: false
    };

  } catch (error) {
    // Avatar failure should NOT fail the profile request.
    // Use local fallback avatar.

    return {
      authorId,
      avatar: DEFAULT_AVATAR,
      degraded: true
    };
  }
}

module.exports = {
  DEFAULT_AVATAR,
  sleep,
  isRetryable,
  withTimeout,
  withRetry,
  getProfileWithAvatar,
};