const postService = require('../services/postService');
const { sendSuccess } = require('../utils/http');

async function list(req, res) {
  const result = await postService.list(
    req.query.page,
    req.query.limit
  );

  return sendSuccess(
    res,
    200,
    result.data,
    result.meta
  );
}

async function getById(req, res) {
  const post =
    await postService.getById(req.params.id);

  return sendSuccess(
    res,
    200,
    post
  );
}

async function create(req, res) {
  const post =
    await postService.create(req.body);

  return sendSuccess(
    res,
    201,
    post
  );
}

async function like(req, res) {
  const post =
    await postService.like(req.params.id);

  return sendSuccess(
    res,
    200,
    post
  );
}

// Used only for testing centralized
// internal error handling.
function explode(req, res, next) {
  const error = new Error(
    'Database connection failed: password=super-secret'
  );

  error.statusCode = 500;

  next(error);
}

module.exports = {
  list,
  getById,
  create,
  like,
  explode
};