const postService = require('../services/postService');

async function list(req, res) {
  const page = Number(req.query.page) || 1;

  // Default limit = 2
  // Maximum limit = 2
  const requestedLimit = Number(req.query.limit) || 2;
  const limit = Math.min(requestedLimit, 2);

  const result = await postService.list(page, limit);

  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta
  });
}

async function getById(req, res) {
  const post = await postService.getById(req.params.id);

  res.status(200).json({
    success: true,
    data: post
  });
}

async function create(req, res) {
  const post = await postService.create(req.body);

  res.status(201).json({
    success: true,
    data: post
  });
}

async function edit(req, res) {
  const post = await postService.edit(
    req.params.id,
    req.body
  );

  res.status(200).json({
    success: true,
    data: post
  });
}

async function remove(req, res) {
  await postService.remove(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      message: 'Post deleted successfully'
    }
  });
}

// Used only to demonstrate centralized error handling
function explode(req, res) {
  const error = new Error(
    'This is a safe test error'
  );

  error.statusCode = 500;

  throw error;
}

module.exports = {
  list,
  getById,
  create,
  edit,
  remove,
  explode
};