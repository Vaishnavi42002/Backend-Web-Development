const store = require('../data/postStore');

async function list(page, limit) {
  const posts = store.getAll();

  const total = posts.length;

  const totalPages =
    Math.ceil(total / limit) || 1;

  const currentPage =
    Math.max(1, Math.min(page, totalPages));

  const start =
    (currentPage - 1) * limit;

  const data = posts.slice(
    start,
    start + limit
  );

  return {
    data,
    meta: {
      page: currentPage,
      limit,
      total,
      totalPages
    }
  };
}

async function getById(id) {
  const post = store.getById(id);

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  return post;
}

async function create(data) {
  return store.create({
    title: data.title,
    content: data.content
  });
}

async function edit(id, data) {
  const post = store.getById(id);

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  return store.update(id, data);
}

async function remove(id) {
  const post = store.getById(id);

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  store.remove(id);
}

module.exports = {
  list,
  getById,
  create,
  edit,
  remove
};