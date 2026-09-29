const { AppError } = require('../utils/AppError');
const commentsRepo = require('../repositories/commentsRepo');
const postsRepo = require('../repositories/postsRepo');

exports.addComment = async (postId, userId, body) => {
  // 1. Check that the post exists
  const post = await postsRepo.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // 2. Check that the post is not locked
  if (post.locked) {
    throw new AppError('Post is locked for new comments', 409);
  }

  // 3. Create the comment
  const comment = await commentsRepo.insert({
    postId,
    authorId: userId,
    body
  });

  // 4. Update comment count
  await postsRepo.incrementCommentCount(postId);

  // 5. Return created comment
  return comment;
};