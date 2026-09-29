const { AppError } = require('../utils/AppError');
const votesRepo = require('../repositories/votesRepo');
const postsRepo = require('../repositories/postsRepo');

exports.castVote = async (postId, userId) => {
  // 1. Post must exist
  const post = await postsRepo.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // 2. User must not have already voted
  const existing = await votesRepo.find(postId, userId);

  if (existing) {
    throw new AppError('You have already voted on this post', 409);
  }

  // 3. Create the vote
  return votesRepo.insert(postId, userId);
};