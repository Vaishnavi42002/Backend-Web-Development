function sendSuccess(res, statusCode, data, meta) {
  const body = {
    success: true,
    data
  };

  if (meta !== undefined) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
}

function sendError(res, statusCode, code, message, details) {
  const body = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (details !== undefined) {
    body.error.details = details;
  }

  return res.status(statusCode).json(body);
}

module.exports = {
  sendSuccess,
  sendError
};