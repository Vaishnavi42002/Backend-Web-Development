const { body, param } = require('express-validator');

const createPost = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
];

const editPost = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters'),

  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty')
];

module.exports = {
  createPost,
  editPost
};