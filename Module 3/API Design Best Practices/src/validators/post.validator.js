const {
  body,
  param,
  query
} = require('express-validator');

const createPost = [
  body('title')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3 })
    .withMessage(
      'Title must be at least 3 characters'
    ),

  body('content')
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
];

const pagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      'Page must be a positive integer'
    ),

  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      'Limit must be a positive integer'
    )
];

const postId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage(
      'ID must be a positive integer'
    )
];

module.exports = {
  createPost,
  pagination,
  postId
};