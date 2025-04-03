import express from 'express';
import { Recipe, Cuisine, Equipment } from '../models/Recipe';
import auth from '../middleware/auth.middleware';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   POST /api/recipes
 * @desc    Create a new recipe
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      ingredients,
      steps,
      prepTime,
      cookTime,
      servings,
      difficulty,
      cuisine,
      dietaryInfo,
      photos,
      equipment,
      calories
    } = req.body;

    // Calculate total time
    const totalTime = prepTime + cookTime;

    // Create new recipe with the authenticated user as author
    const newRecipe = new Recipe({
      title,
      description,
      author: req.user!.id,
      ingredients,
      steps,
      prepTime,
      cookTime,
      totalTime,
      servings,
      difficulty,
      cuisine,
      dietaryInfo,
      photos,
      equipment,
      calories
    });

    const recipe = await newRecipe.save();

    res.status(201).json(recipe);
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    console.error('Recipe creation error:', error);
    res.status(500).json({ message: 'Server error during recipe creation' });
  }
});

/**
 * @route   GET /api/recipes
 * @desc    Get all recipes with optional filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      cuisine,
      difficulty,
      maxPrepTime,
      maxCookTime,
      maxTotalTime,
      author,
      dietaryInfo,
      search,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter: any = {};

    // Add filters if provided
    if (cuisine) {
      filter.cuisine = cuisine;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (maxPrepTime) {
      filter.prepTime = { $lte: parseInt(maxPrepTime as string) };
    }

    if (maxCookTime) {
      filter.cookTime = { $lte: parseInt(maxCookTime as string) };
    }

    if (maxTotalTime) {
      filter.totalTime = { $lte: parseInt(maxTotalTime as string) };
    }

    if (author) {
      filter.author = author;
    }

    if (dietaryInfo) {
      filter.dietaryInfo = { $in: (dietaryInfo as string).split(',') };
    }

    // Text search if provided
    if (search) {
      filter.$text = { $search: search as string };
    }

    // Calculate pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Get recipes with pagination
    const recipes = await Recipe.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .populate('author', 'username profilePicture')
      .exec();

    // Get total count for pagination
    const totalRecipes = await Recipe.countDocuments(filter);

    res.json({
      recipes,
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(totalRecipes / parseInt(limit as string)),
      totalRecipes
    });
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({ message: 'Server error fetching recipes' });
  }
});

/**
 * @route   GET /api/recipes/cuisines
 * @desc    Get all cuisine types
 * @access  Public
 */
router.get('/cuisines', (req, res) => {
  try {
    const cuisines = Object.values(Cuisine);
    res.json(cuisines);
  } catch (error) {
    console.error('Get cuisines error:', error);
    res.status(500).json({ message: 'Server error fetching cuisines' });
  }
});

/**
 * @route   GET /api/recipes/equipment
 * @desc    Get all equipment types
 * @access  Public
 */
router.get('/equipment', (req, res) => {
  try {
    const equipment = Object.values(Equipment);
    res.json(equipment);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ message: 'Server error fetching equipment' });
  }
});

/**
 * @route   GET /api/recipes/:id
 * @desc    Get a recipe by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('author', 'username profilePicture')
      .exec();

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error) {
    console.error('Get recipe error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    
    res.status(500).json({ message: 'Server error fetching recipe' });
  }
});

/**
 * @route   PUT /api/recipes/:id
 * @desc    Update a recipe
 * @access  Private (only author)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      ingredients,
      steps,
      prepTime,
      cookTime,
      servings,
      difficulty,
      cuisine,
      dietaryInfo,
      photos,
      equipment,
      calories
    } = req.body;

    // Calculate total time
    const totalTime = prepTime + cookTime;

    // Find recipe and check ownership
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check if user is the author
    if (recipe.author.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'User not authorized to update this recipe' });
    }

    // Update recipe
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        ingredients,
        steps,
        prepTime,
        cookTime,
        totalTime,
        servings,
        difficulty,
        cuisine,
        dietaryInfo,
        photos,
        equipment,
        calories
      },
      { new: true }
    ).populate('author', 'username profilePicture');

    res.json(updatedRecipe);
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    console.error('Recipe update error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    
    res.status(500).json({ message: 'Server error updating recipe' });
  }
});

/**
 * @route   DELETE /api/recipes/:id
 * @desc    Delete a recipe
 * @access  Private (only author)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check if user is the author
    if (recipe.author.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'User not authorized to delete this recipe' });
    }

    await recipe.deleteOne();

    res.json({ message: 'Recipe removed' });
  } catch (error) {
    console.error('Recipe deletion error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    
    res.status(500).json({ message: 'Server error deleting recipe' });
  }
});

/**
 * @route   POST /api/recipes/:id/like
 * @desc    Like a recipe
 * @access  Private
 */
router.post('/:id/like', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check if recipe has already been liked by this user
    if (recipe.likes.some(like => like.toString() === req.user!.id)) {
      return res.status(400).json({ message: 'Recipe already liked' });
    }

    // Add user id to likes array
    recipe.likes.push(new mongoose.Types.ObjectId(req.user!.id));
    await recipe.save();

    res.json(recipe.likes);
  } catch (error) {
    console.error('Like recipe error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    
    res.status(500).json({ message: 'Server error liking recipe' });
  }
});

/**
 * @route   POST /api/recipes/:id/unlike
 * @desc    Unlike a recipe
 * @access  Private
 */
router.post('/:id/unlike', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check if recipe has not been liked by this user
    if (!recipe.likes.some(like => like.toString() === req.user!.id)) {
      return res.status(400).json({ message: 'Recipe has not yet been liked' });
    }

    // Remove user id from likes array
    recipe.likes = recipe.likes.filter(like => like.toString() !== req.user!.id);
    await recipe.save();

    res.json(recipe.likes);
  } catch (error) {
    console.error('Unlike recipe error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    
    res.status(500).json({ message: 'Server error unliking recipe' });
  }
});

export default router; 