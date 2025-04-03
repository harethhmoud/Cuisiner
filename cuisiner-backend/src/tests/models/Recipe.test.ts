import mongoose from 'mongoose';
import { Recipe, Cuisine, Equipment } from '../../models/Recipe';
import { User } from '../../models/User';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Recipe Model', () => {
  let user: any;
  let recipe: any;

  beforeEach(async () => {
    // Create test user
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!'
    });

    // Create test recipe
    recipe = await Recipe.create({
      title: 'Test Recipe',
      description: 'Test Description',
      author: user._id,
      ingredients: [{ name: 'Test Ingredient', amount: 1, unit: 'cup' }],
      steps: [{ order: 1, description: 'Test Step', duration: 10, isParallel: false }],
      cuisine: Cuisine.CHINESE,
      difficulty: 'easy',
      prepTime: 10,
      cookTime: 20,
      totalTime: 30,
      servings: 2,
      photos: ['test-photo-url.jpg'],
      equipment: [Equipment.KNIFE, Equipment.MIXING_BOWL]
    });
  });

  describe('Recipe Creation', () => {
    it('should create a recipe with valid data', async () => {
      expect(recipe).toBeDefined();
      expect(recipe.title).toBe('Test Recipe');
      expect(recipe.description).toBe('Test Description');
      expect(recipe.author.toString()).toBe(user._id.toString());
      expect(recipe.cuisine).toBe(Cuisine.CHINESE);
      expect(recipe.difficulty).toBe('easy');
      expect(recipe.ingredients).toHaveLength(1);
      expect(recipe.steps).toHaveLength(1);
      expect(recipe.prepTime).toBe(10);
      expect(recipe.cookTime).toBe(20);
      expect(recipe.totalTime).toBe(30);
    });

    it('should require a title', async () => {
      const recipeWithoutTitle = new Recipe({
        description: 'Test Description',
        author: user._id,
        ingredients: [{ name: 'Test Ingredient', amount: 1, unit: 'cup' }],
        steps: [{ order: 1, description: 'Test Step', duration: 10, isParallel: false }],
        cuisine: Cuisine.CHINESE,
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 20,
        totalTime: 30,
        servings: 2,
        photos: ['test-photo-url.jpg'],
        equipment: [Equipment.KNIFE, Equipment.MIXING_BOWL]
      });

      let validationError: any;
      try {
        await recipeWithoutTitle.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors.title).toBeDefined();
    });

    it('should require a valid cuisine enum value', async () => {
      const recipeWithInvalidCuisine = new Recipe({
        title: 'Test Recipe',
        description: 'Test Description',
        author: user._id,
        ingredients: [{ name: 'Test Ingredient', amount: 1, unit: 'cup' }],
        steps: [{ order: 1, description: 'Test Step', duration: 10, isParallel: false }],
        cuisine: 'not-a-valid-cuisine',
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 20,
        totalTime: 30,
        servings: 2,
        photos: ['test-photo-url.jpg'],
        equipment: [Equipment.KNIFE, Equipment.MIXING_BOWL]
      });

      let validationError: any;
      try {
        // @ts-ignore - We're intentionally testing invalid data
        await recipeWithInvalidCuisine.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors.cuisine).toBeDefined();
    });

    it('should automatically recalculate totalTime if prep and cook times change', async () => {
      recipe.prepTime = 15;
      recipe.cookTime = 25;
      await recipe.save();

      expect(recipe.totalTime).toBe(40);
    });
  });

  describe('Recipe Ingredients and Steps', () => {
    it('should validate ingredient properties', async () => {
      const recipeWithInvalidIngredient = new Recipe({
        title: 'Test Recipe',
        description: 'Test Description',
        author: user._id,
        ingredients: [{ name: 'Test Ingredient', amount: -1, unit: 'cup' }], // negative amount
        steps: [{ order: 1, description: 'Test Step', duration: 10, isParallel: false }],
        cuisine: Cuisine.CHINESE,
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 20,
        totalTime: 30,
        servings: 2,
        photos: ['test-photo-url.jpg'],
        equipment: [Equipment.KNIFE, Equipment.MIXING_BOWL]
      });

      let validationError: any;
      try {
        await recipeWithInvalidIngredient.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors['ingredients.0.amount']).toBeDefined();
    });

    it('should validate step properties', async () => {
      const recipeWithInvalidStep = new Recipe({
        title: 'Test Recipe',
        description: 'Test Description',
        author: user._id,
        ingredients: [{ name: 'Test Ingredient', amount: 1, unit: 'cup' }],
        steps: [{ order: 1, description: 'Test Step', duration: -10, isParallel: false }], // negative duration
        cuisine: Cuisine.CHINESE,
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 20,
        totalTime: 30,
        servings: 2,
        photos: ['test-photo-url.jpg'],
        equipment: [Equipment.KNIFE, Equipment.MIXING_BOWL]
      });

      let validationError: any;
      try {
        await recipeWithInvalidStep.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors['steps.0.duration']).toBeDefined();
    });
  });
}); 