import express from 'express';
import { Post } from '../models/Post';
import { Recipe } from '../models/Recipe';
import auth from '../middleware/auth.middleware';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      recipe,
      photos,
      caption,
      modifications
    } = req.body;

    // Validate recipe existence
    const recipeExists = await Recipe.findById(recipe);
    if (!recipeExists) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Create new post with the authenticated user as author
    const newPost = new Post({
      author: req.user!.id,
      recipe,
      photos,
      caption,
      modifications
    });

    const post = await newPost.save();

    // Return post with populated fields
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username profilePicture')
      .populate('recipe', 'title photos cuisine')
      .exec();

    res.status(201).json(populatedPost);
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    console.error('Post creation error:', error);
    res.status(500).json({ message: 'Server error during post creation' });
  }
});

/**
 * @route   GET /api/posts
 * @desc    Get posts for feed (from followed users)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;
    
    // Get user's following list
    const user = await mongoose.model('User').findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add user's own ID to see their posts in feed too
    const followingIds = [...user.following, user._id];
    
    // Get feed posts
    const posts = await Post.getFeed(
      followingIds, 
      parseInt(limit as string), 
      parseInt(skip as string)
    );
    
    // Get total count for pagination
    const totalPosts = await Post.countDocuments({ author: { $in: followingIds } });
    
    res.json({
      posts,
      currentPage: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
      totalPages: Math.ceil(totalPosts / parseInt(limit as string)),
      totalPosts
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error fetching feed posts' });
  }
});

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get posts by a specific user
 * @access  Public
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, skip = 0 } = req.query;
    
    // Validate user exists
    const userExists = await mongoose.model('User').findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user posts
    const posts = await Post.getUserPosts(
      new mongoose.Types.ObjectId(userId), 
      parseInt(limit as string), 
      parseInt(skip as string)
    );
    
    // Get total count for pagination
    const totalPosts = await Post.countDocuments({ author: userId });
    
    res.json({
      posts,
      currentPage: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
      totalPages: Math.ceil(totalPosts / parseInt(limit as string)),
      totalPosts
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    res.status(500).json({ message: 'Server error fetching user posts' });
  }
});

/**
 * @route   GET /api/posts/recipe/:recipeId
 * @desc    Get posts for a specific recipe
 * @access  Public
 */
router.get('/recipe/:recipeId', async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { limit = 10, skip = 0 } = req.query;
    
    // Validate recipe exists
    const recipeExists = await Recipe.findById(recipeId);
    if (!recipeExists) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    // Get posts for this recipe
    const posts = await Post.find({ recipe: recipeId })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string))
      .populate('author', 'username profilePicture')
      .exec();
    
    // Get total count for pagination
    const totalPosts = await Post.countDocuments({ recipe: recipeId });
    
    res.json({
      posts,
      currentPage: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
      totalPages: Math.ceil(totalPosts / parseInt(limit as string)),
      totalPosts
    });
  } catch (error) {
    console.error('Get recipe posts error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    
    res.status(500).json({ message: 'Server error fetching recipe posts' });
  }
});

/**
 * @route   GET /api/posts/:id
 * @desc    Get a post by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profilePicture')
      .populate('recipe', 'title photos cuisine')
      .exec();

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    res.status(500).json({ message: 'Server error fetching post' });
  }
});

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Private (only author)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      photos,
      caption,
      modifications
    } = req.body;

    // Find post and check ownership
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'User not authorized to update this post' });
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        photos,
        caption,
        modifications
      },
      { new: true }
    )
    .populate('author', 'username profilePicture')
    .populate('recipe', 'title photos cuisine')
    .exec();

    res.json(updatedPost);
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    console.error('Post update error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    res.status(500).json({ message: 'Server error updating post' });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Private (only author)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'User not authorized to delete this post' });
    }

    await post.deleteOne();

    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error('Post deletion error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    res.status(500).json({ message: 'Server error deleting post' });
  }
});

/**
 * @route   POST /api/posts/:id/like
 * @desc    Like a post
 * @access  Private
 */
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Use the instance method from Post model
    await post.like(new mongoose.Types.ObjectId(req.user!.id));

    res.json(post.likes);
  } catch (error) {
    console.error('Like post error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    res.status(500).json({ message: 'Server error liking post' });
  }
});

/**
 * @route   POST /api/posts/:id/unlike
 * @desc    Unlike a post
 * @access  Private
 */
router.post('/:id/unlike', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Use the instance method from Post model
    await post.unlike(new mongoose.Types.ObjectId(req.user!.id));

    res.json(post.likes);
  } catch (error) {
    console.error('Unlike post error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    res.status(500).json({ message: 'Server error unliking post' });
  }
});

export default router; 