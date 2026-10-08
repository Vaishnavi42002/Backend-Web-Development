const store = require('../data/postStore');
const AppError = require('../utils/AppError');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 2;
const MAX_LIMIT = 2;

async function list(pageInput, limitInput) {
  const requestedPage = Number(pageInput) || DEFAULT_PAGE;
  const requestedLimit = Number(limitInput) || DEFAULT_LIMIT;

  const page = Math.max(1, requestedPage);

  // Server-side limit protection
  const limit = Math.min(
    Math.max(1, requestedLimit),
    MAX_LIMIT
  );

  const posts = store.getAll();

  const total = posts.length;

  const totalPages =
    Math.max(1, Math.ceil(total / limit));

  const currentPage =
    Math.min(page, totalPages);

  const start =
    (currentPage - 1) * limit;

  const data =
    posts.slice(start, start + limit);

  return {
    data,

    meta: {
      page: currentPage,
      limit,
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    }
  };
}

async function getById(id) {
  const post = store.getById(id);

  if (!post) {
    throw new AppError(
      'Post not found',
      404,
      'POST_NOT_FOUND'
    );
  }

  return post;
}

async function create(data) {
  return store.create({
    title: data.title.trim(),
    content: data.content.trim()
  });
}

async function like(id) {
  const post = store.getById(id);

  if (!post) {
    throw new AppError(
      'Post not found',
      404,
      'POST_NOT_FOUND'
    );
  }

  return store.like(id);
}

module.exports = {
  list,
  getById,
  create,
  like,
  MAX_LIMIT
};