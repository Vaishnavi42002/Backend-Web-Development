// In-memory store — no database needed for this assignment.
// Users have a role: 'member' | 'moderator' | 'admin'.
// Posts have an authorId (the member who owns them).

const users = [
  { id: 'u-A', role: 'member' },
  { id: 'u-B', role: 'member' },
  { id: 'u-mod', role: 'moderator' },
  { id: 'u-admin', role: 'admin' },
];

const posts = [
  { id: '1', authorId: 'u-A', title: 'Member A first post', hidden: false },
  { id: '2', authorId: 'u-B', title: 'Member B first post', hidden: false },
];

module.exports = { users, posts };
