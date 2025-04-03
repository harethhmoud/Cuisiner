import express from 'express';
import { Comment } from '../models/Comment';
import { Post } from '../models/Post';
import auth from '../middleware/auth.middleware';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   POST /api/comments/post/:postId
 * @desc    Create a comment on a post
 * @access  Private
 */
router.post('/post/:postId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;
    
    // Validate post existence
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Create new comment
    const newComment = new Comment({
      post: postId,
      user: req.user!.id,
      content
    });
    
    const comment = await newComment.save();
    
    // Return comment with populated user
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username profilePicture')
      .exec();
      
    res.status(201).json(populatedComment);
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    console.error('Comment creation error:', error);
    res.status(500).json({ message: 'Server error during comment creation' });
  }
});

/**
 * @route   POST /api/comments/:commentId/reply
 * @desc    Reply to a comment
 * @access  Private
 */
router.post('/:commentId/reply', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const { commentId } = req.params;
    
    // Validate parent comment existence
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Create new reply
    const newReply = new Comment({
      post: parentComment.post, // Same post as parent comment
      user: req.user!.id,
      content,
      parentComment: commentId
    });
    
    const reply = await newReply.save();
    
    // Return reply with populated user
    const populatedReply = await Comment.findById(reply._id)
      .populate('user', 'username profilePicture')
      .exec();
      
    res.status(201).json(populatedReply);
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    console.error('Reply creation error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    res.status(500).json({ message: 'Server error during reply creation' });
  }
});

/**
 * @route   GET /api/comments/post/:postId
 * @desc    Get comments for a post
 * @access  Public
 */
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 10, skip = 0 } = req.query;
    
    // Validate post existence
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Get comments using static method
    const comments = await Comment.getPostComments(
      new mongoose.Types.ObjectId(postId),
      parseInt(limit as string),
      parseInt(skip as string)
    );
    
    // Get total count for pagination (only top-level comments)
    const totalComments = await Comment.countDocuments({ 
      post: postId,
      parentComment: { $exists: false }
    });
    
    res.json({
      comments,
      currentPage: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
      totalPages: Math.ceil(totalComments / parseInt(limit as string)),
      totalComments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    res.status(500).json({ message: 'Server error fetching comments' });
  }
});

/**
 * @route   GET /api/comments/:commentId/replies
 * @desc    Get replies to a comment
 * @access  Public
 */
router.get('/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { limit = 10, skip = 0 } = req.query;
    
    // Validate comment existence
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Get replies using static method
    const replies = await Comment.getCommentReplies(
      new mongoose.Types.ObjectId(commentId),
      parseInt(limit as string),
      parseInt(skip as string)
    );
    
    // Get total count for pagination
    const totalReplies = await Comment.countDocuments({ parentComment: commentId });
    
    res.json({
      replies,
      currentPage: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
      totalPages: Math.ceil(totalReplies / parseInt(limit as string)),
      totalReplies
    });
  } catch (error) {
    console.error('Get replies error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    res.status(500).json({ message: 'Server error fetching replies' });
  }
});

/**
 * @route   PUT /api/comments/:id
 * @desc    Update a comment
 * @access  Private (only author)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    // Find comment and check ownership
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the author
    if (comment.user.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'User not authorized to update this comment' });
    }
    
    // Update comment
    comment.content = content;
    comment.isEdited = true;
    await comment.save();
    
    // Return updated comment with populated user
    const updatedComment = await Comment.findById(comment._id)
      .populate('user', 'username profilePicture')
      .exec();
      
    res.json(updatedComment);
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    console.error('Comment update error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    res.status(500).json({ message: 'Server error updating comment' });
  }
});

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a comment
 * @access  Private (only author)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the author
    if (comment.user.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'User not authorized to delete this comment' });
    }
    
    // Use custom method that also decrements the comment count on the post
    await comment.deleteAndUpdateCount();
    
    res.json({ message: 'Comment removed' });
  } catch (error) {
    console.error('Comment deletion error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    res.status(500).json({ message: 'Server error deleting comment' });
  }
});

/**
 * @route   POST /api/comments/:id/like
 * @desc    Like a comment
 * @access  Private
 */
router.post('/:id/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if already liked
    if (comment.likes.some(like => like.toString() === req.user!.id)) {
      return res.status(400).json({ message: 'Comment already liked' });
    }
    
    // Add user ID to likes array
    comment.likes.push(new mongoose.Types.ObjectId(req.user!.id));
    await comment.save();
    
    res.json(comment.likes);
  } catch (error) {
    console.error('Like comment error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    res.status(500).json({ message: 'Server error liking comment' });
  }
});

/**
 * @route   POST /api/comments/:id/unlike
 * @desc    Unlike a comment
 * @access  Private
 */
router.post('/:id/unlike', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if not liked
    if (!comment.likes.some(like => like.toString() === req.user!.id)) {
      return res.status(400).json({ message: 'Comment has not yet been liked' });
    }
    
    // Remove user ID from likes array
    comment.likes = comment.likes.filter(like => like.toString() !== req.user!.id);
    await comment.save();
    
    res.json(comment.likes);
  } catch (error) {
    console.error('Unlike comment error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    res.status(500).json({ message: 'Server error unliking comment' });
  }
});

export default router; 