const { validationResult } = require('express-validator');
const { sendError } = require('./http');

function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    );
  }

  next();
}

module.exports = validateRequest;