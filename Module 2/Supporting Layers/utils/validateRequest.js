const { validationResult } = require('express-validator');
const AppError = require('./AppError');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new AppError('Validation failed', 422)
    );
  }

  next();
};

module.exports = validateRequest;