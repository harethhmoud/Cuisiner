import express from 'express';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';
import auth from '../middleware/auth.middleware';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   GET /api/users/profile/:userId
 * @desc    Get user profile by ID
 * @access  Public
 */
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { profilePicture, bio } = req.body;
    
    const user = await User.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields if provided
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }
    
    if (bio !== undefined) {
      user.bio = bio;
    }
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user!.id).select('-password -__v');
    res.json(updatedUser);
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

/**
 * @route   POST /api/users/follow/:userId
 * @desc    Follow a user
 * @access  Private
 */
router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Can't follow yourself
    if (userId === req.user!.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    
    // Find user to follow
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User to follow not found' });
    }
    
    // Find current user
    const currentUser = await User.findById(req.user!.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }
    
    // Check if already following
    if (currentUser.following.some(id => id.toString() === userId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }
    
    // Update following list for current user
    currentUser.following.push(new mongoose.Types.ObjectId(userId));
    await currentUser.save();
    
    // Update followers list for user being followed
    userToFollow.followers.push(new mongoose.Types.ObjectId(req.user!.id));
    await userToFollow.save();
    
    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow user error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    res.status(500).json({ message: 'Server error following user' });
  }
});

/**
 * @route   POST /api/users/unfollow/:userId
 * @desc    Unfollow a user
 * @access  Private
 */
router.post('/unfollow/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find current user
    const currentUser = await User.findById(req.user!.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }
    
    // Find user to unfollow
    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User to unfollow not found' });
    }
    
    // Check if not following
    if (!currentUser.following.some(id => id.toString() === userId)) {
      return res.status(400).json({ message: 'Not following this user' });
    }
    
    // Update following list for current user
    currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
    await currentUser.save();
    
    // Update followers list for user being unfollowed
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== req.user!.id);
    await userToUnfollow.save();
    
    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    res.status(500).json({ message: 'Server error unfollowing user' });
  }
});

/**
 * @route   GET /api/users/followers
 * @desc    Get current user's followers
 * @access  Private
 */
router.get('/followers', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user!.id)
      .populate('followers', 'username profilePicture bio')
      .select('followers');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.followers);
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Server error fetching followers' });
  }
});

/**
 * @route   GET /api/users/following
 * @desc    Get users the current user is following
 * @access  Private
 */
router.get('/following', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user!.id)
      .populate('following', 'username profilePicture bio')
      .select('following');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.following);
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Server error fetching following users' });
  }
});

/**
 * @route   POST /api/users/save-recipe/:recipeId
 * @desc    Save a recipe
 * @access  Private
 */
router.post('/save-recipe/:recipeId', auth, async (req, res) => {
  try {
    const { recipeId } = req.params;
    
    // Validate recipe existence
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    // Find current user
    const user = await User.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if already saved
    if (user.savedRecipes.some(id => id.toString() === recipeId)) {
      return res.status(400).json({ message: 'Recipe already saved' });
    }
    
    // Add to saved recipes
    user.savedRecipes.push(new mongoose.Types.ObjectId(recipeId));
    await user.save();
    
    res.json({ message: 'Recipe saved successfully' });
  } catch (error) {
    console.error('Save recipe error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    
    res.status(500).json({ message: 'Server error saving recipe' });
  }
});

/**
 * @route   POST /api/users/unsave-recipe/:recipeId
 * @desc    Unsave a recipe
 * @access  Private
 */
router.post('/unsave-recipe/:recipeId', auth, async (req, res) => {
  try {
    const { recipeId } = req.params;
    
    // Find current user
    const user = await User.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if not saved
    if (!user.savedRecipes.some(id => id.toString() === recipeId)) {
      return res.status(400).json({ message: 'Recipe not saved' });
    }
    
    // Remove from saved recipes
    user.savedRecipes = user.savedRecipes.filter(id => id.toString() !== recipeId);
    await user.save();
    
    res.json({ message: 'Recipe unsaved successfully' });
  } catch (error) {
    console.error('Unsave recipe error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    
    res.status(500).json({ message: 'Server error unsaving recipe' });
  }
});

/**
 * @route   GET /api/users/saved-recipes
 * @desc    Get saved recipes
 * @access  Private
 */
router.get('/saved-recipes', auth, async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;
    
    // Find user and populate saved recipes
    const user = await User.findById(req.user!.id)
      .select('savedRecipes')
      .populate({
        path: 'savedRecipes',
        options: {
          limit: parseInt(limit as string),
          skip: parseInt(skip as string),
          sort: { createdAt: -1 }
        }
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get total count for pagination
    const count = await User.findById(req.user!.id).select('savedRecipes');
    const totalRecipes = count ? count.savedRecipes.length : 0;
    
    res.json({
      recipes: user.savedRecipes,
      currentPage: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
      totalPages: Math.ceil(totalRecipes / parseInt(limit as string)),
      totalRecipes
    });
  } catch (error) {
    console.error('Get saved recipes error:', error);
    res.status(500).json({ message: 'Server error fetching saved recipes' });
  }
});

/**
 * @route   GET /api/users/search
 * @desc    Search for users by username
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { query, limit = 10, skip = 0 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Search users by username
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    })
    .select('username profilePicture bio')
    .skip(parseInt(skip as string))
    .limit(parseInt(limit as string));
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments({
      username: { $regex: query, $options: 'i' }
    });
    
    res.json({
      users,
      currentPage: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
      totalPages: Math.ceil(totalUsers / parseInt(limit as string)),
      totalUsers
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error searching users' });
  }
});

export default router; 