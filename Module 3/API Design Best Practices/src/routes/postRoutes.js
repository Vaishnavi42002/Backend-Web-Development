const express = require('express');

const router = express.Router();

const controller = require('../controllers/postController');
const asyncHandler = require('../utils/asyncHandler');
const validateRequest = require('../utils/validateRequest');
const v = require('../validators/post.validator');

// GET /posts
router.get(
  '/',
  asyncHandler(controller.list)
);

// GET /posts/:id
router.get(
  '/:id',
  asyncHandler(controller.getById)
);

// POST /posts
router.post(
  '/',
  v.createPost,
  validateRequest,
  asyncHandler(controller.create)
);

// PATCH /posts/:id
router.patch(
  '/:id',
  v.editPost,
  validateRequest,
  asyncHandler(controller.edit)
);

// DELETE /posts/:id
router.delete(
  '/:id',
  asyncHandler(controller.remove)
);

module.exports = router;