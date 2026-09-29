const { AppError } = require('../utils/AppError');
const postsRepo = require('../repositories/postsRepo');

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

exports.editPost = async (postId, userId, changes) => {
  // 1. Post must exist
  const post = await postsRepo.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // 2. Only the author can edit
  if (post.authorId !== userId) {
    throw new AppError('You can only edit your own post', 403);
  }

  // 3. Post must be edited within 24 hours
  const ageMs = Date.now() - post.createdAt;

  if (ageMs > EDIT_WINDOW_MS) {
    throw new AppError('Post can no longer be edited', 403);
  }

  // 4. All checks passed
  return postsRepo.update(postId, changes);
};