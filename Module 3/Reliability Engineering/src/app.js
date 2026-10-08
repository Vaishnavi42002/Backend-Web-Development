const {
  createAvatarClient
} = require('./clients/avatarClient');

const {
  getProfileWithAvatar
} = require('./services/profileService');

async function runScenario(mode) {
  const avatarClient =
    createAvatarClient(mode);

  const profile =
    await getProfileWithAvatar(
      'maya',
      avatarClient
    );

  console.log(`\n${mode.toUpperCase()}`);

  console.log(
    'calls:',
    avatarClient.calls.length
  );

  console.log(
    'degraded:',
    profile.degraded
  );

  console.log(
    'avatar:',
    profile.avatar.url
  );
}

async function main() {
  const scenarios = [
    'healthy',
    'blip',
    'slow',
    'down',
    'badRequest'
  ];

  for (const mode of scenarios) {
    await runScenario(mode);
  }
}

main().catch(console.error);