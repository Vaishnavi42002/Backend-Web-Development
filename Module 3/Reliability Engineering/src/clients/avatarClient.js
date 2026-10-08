const plans = {
  healthy: [
    {
      type: 'success',
      avatar: {
        url: 'https://cdn.aurora-profiles.dev/avatars/maya.png',
        initials: 'M'
      }
    }
  ],

  blip: [
    {
      type: 'error',
      status: 503,
      message: 'avatar service temporarily unavailable'
    },
    {
      type: 'success',
      avatar: {
        url: 'https://cdn.aurora-profiles.dev/avatars/maya.png',
        initials: 'M'
      }
    }
  ],

  slow: [
    {
      type: 'hang'
    }
  ],

  down: [
    {
      type: 'error',
      status: 503,
      message: 'avatar service unavailable'
    }
  ],

  badRequest: [
    {
      type: 'error',
      status: 400,
      message: 'invalid avatar id'
    }
  ]
};

function createAvatarClient(mode = 'healthy') {
  const calls = [];
  let position = 0;

  return {
    calls,

    async getAvatar(authorId, { signal } = {}) {
      calls.push({
        authorId,
        attempt: position + 1
      });

      const step =
        plans[mode][
          Math.min(
            position,
            plans[mode].length - 1
          )
        ];

      position += 1;

      if (step.type === 'success') {
        return {
          ...step.avatar,
          authorId
        };
      }

      if (step.type === 'hang') {
        return new Promise((resolve, reject) => {
          if (signal) {
            signal.addEventListener(
              'abort',
              () => {
                const error = new Error(
                  'avatar request timed out'
                );

                error.name = 'AbortError';

                reject(error);
              },
              { once: true }
            );
          }
        });
      }

      const error = new Error(step.message);

      error.status = step.status;

      throw error;
    }
  };
}

module.exports = {
  createAvatarClient
};