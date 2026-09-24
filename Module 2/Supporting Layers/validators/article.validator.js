const { body } = require('express-validator');

const createArticle = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim(),

  body('body')
    .notEmpty()
    .isLength({ max: 2000 })
    .withMessage('Body is required and must be under 2000 characters')
];

const updateArticle = [
  body('title')
    .optional()
    .notEmpty()
    .trim(),

  body('body')
    .optional()
    .isLength({ max: 2000 })
];

module.exports = {
  createArticle,
  updateArticle
};