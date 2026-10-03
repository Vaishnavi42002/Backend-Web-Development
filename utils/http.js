function sendList(res, rows) {
  return res.status(200).json(rows);
}

function sendCreated(res, post) {
  return res.status(200).json({ post });
}

function sendOk(res, payload) {
  return res.status(200).json(payload);
}

function sendError(res, status, payload) {
  return res.status(status).json(payload);
}

module.exports = {
  sendList,
  sendCreated,
  sendOk,
  sendError
};
