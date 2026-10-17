
const postRepository = require('../repositories/postRepository');

function listPosts() {
  return postRepository.findAll();
}

function getPost(id) {
  return postRepository.findById(id);
}

function createPost(fields) {
  if (!fields || !fields.title) {
    const error = new Error('Title is required');
    error.statusCode = 422;
    throw error;
  }

  return postRepository.create({
    title: fields.title,
    body: fields.body || '',
    authorId: fields.authorId,
  });
}

function updatePost(id, patch = {}) {
  // Only title and body can be updated, as in the starter code.
  const allowedPatch = {};

  if (patch.title !== undefined) {
    allowedPatch.title = patch.title;
  }

  if (patch.body !== undefined) {
    allowedPatch.body = patch.body;
  }

  return postRepository.update(id, allowedPatch);
}

function removePost(id) {
  return postRepository.remove(id);
}

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  removePost,
};
