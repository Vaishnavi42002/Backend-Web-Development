
const posts = new Map([
  [
    1,
    {
      id: 1,
      title: 'First post',
      body: 'Repository boundaries protect change.',
      authorId: 7,
    },
  ],
  [
    2,
    {
      id: 2,
      title: 'Second post',
      body: 'Services should speak in domain language.',
      authorId: 8,
    },
  ],
]);

let nextId = 3;

function findAll() {
  // Return a new array with copies of the records.
  return Array.from(posts.values(), (post) => ({ ...post }));
}

function findById(id) {
  const post = posts.get(Number(id));
  return post ? { ...post } : null;
}

function create(fields) {
  const post = {
    id: nextId++,
    title: fields.title,
    body: fields.body,
    authorId: fields.authorId,
  };

  posts.set(post.id, post);

  return { ...post };
}

function update(id, patch) {
  const numericId = Number(id);
  const existingPost = posts.get(numericId);

  if (!existingPost) {
    return null;
  }

  const updatedPost = {
    ...existingPost,
    ...patch,
    id: existingPost.id,
  };

  posts.set(numericId, updatedPost);

  return { ...updatedPost };
}

function remove(id) {
  return posts.delete(Number(id));
}

// When switching to Prisma, replace Map operations and local ID
// generation with database queries and database-generated IDs.
// The five repository methods and their result contracts remain
// the same. Services retain their business rules, although they
// must await repository calls if the Prisma implementation is async.

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
