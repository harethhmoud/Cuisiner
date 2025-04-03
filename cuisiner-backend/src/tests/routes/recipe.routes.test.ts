import request from 'supertest';
import app from '../../server';
import { User } from '../../models/User';
import { Recipe, Cuisine, Equipment } from '../../models/Recipe';
import mongoose from 'mongoose';
import '@jest/globals';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

describe('Recipe Routes', () => {
  let token: string;
  let userId: string;
  let recipeId: string;

  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!'
  };

  const testRecipe = {
    title: 'Test Recipe',
    description: 'Test recipe description',
    ingredients: [{ name: 'Test Ingredient', amount: 1, unit: 'cup' }],
    steps: [{ order: 1, description: 'Test Step', duration: 10, isParallel: false }],
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'medium',
    cuisine: Cuisine.ITALIAN,
    photos: ['https://example.com/photo.jpg'],
    equipment: [Equipment.KNIFE, Equipment.MIXING_BOWL]
  };

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Recipe.deleteMany({});

    // Create a test user and get auth token
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    token = res.body.token;
    userId = res.body.user.id;
  });

  describe('POST /api/recipes', () => {
    it('should create a new recipe', async () => {
      const res = await request(app)
        .post('/api/recipes')
        .set('x-auth-token', token)
        .send(testRecipe);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe(testRecipe.title);
      expect(res.body.description).toBe(testRecipe.description);
      expect(res.body.author.toString()).toBe(userId);
      expect(res.body.totalTime).toBe(testRecipe.prepTime + testRecipe.cookTime);

      recipeId = res.body._id;
    });

    it('should not create a recipe without authentication', async () => {
      const res = await request(app)
        .post('/api/recipes')
        .send(testRecipe);

      expect(res.status).toBe(401);
    });

    it('should not create a recipe with missing required fields', async () => {
      const invalidRecipe = { ...testRecipe } as Partial<typeof testRecipe>;
      invalidRecipe.title = undefined;

      const res = await request(app)
        .post('/api/recipes')
        .set('x-auth-token', token)
        .send(invalidRecipe);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Title is required');
    });
  });

  describe('GET /api/recipes', () => {
    beforeEach(async () => {
      // Create test recipes for filtering tests
      await Recipe.create({
        ...testRecipe,
        author: new mongoose.Types.ObjectId(userId),
        title: 'Italian Pasta',
        cuisine: Cuisine.ITALIAN,
        totalTime: testRecipe.prepTime + testRecipe.cookTime
      });

      await Recipe.create({
        ...testRecipe,
        author: new mongoose.Types.ObjectId(userId),
        title: 'Chinese Stir Fry',
        cuisine: Cuisine.CHINESE,
        totalTime: 15,
        prepTime: 5,
        cookTime: 10
      });
    });

    it('should get all recipes', async () => {
      const res = await request(app).get('/api/recipes');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('recipes');
      expect(res.body.recipes).toHaveLength(2);
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('currentPage');
    });

    it('should filter recipes by cuisine', async () => {
      const res = await request(app)
        .get('/api/recipes')
        .query({ cuisine: Cuisine.ITALIAN });

      expect(res.status).toBe(200);
      expect(res.body.recipes).toHaveLength(1);
      expect(res.body.recipes[0].title).toBe('Italian Pasta');
    });

    it('should filter recipes by maximum total time', async () => {
      const res = await request(app)
        .get('/api/recipes')
        .query({ maxTotalTime: 15 });

      expect(res.status).toBe(200);
      expect(res.body.recipes).toHaveLength(1);
      expect(res.body.recipes[0].title).toBe('Chinese Stir Fry');
    });
  });

  describe('GET /api/recipes/:id', () => {
    let recipeId: string;

    beforeEach(async () => {
      // Create a test recipe
      const recipe = await Recipe.create({
        ...testRecipe,
        author: new mongoose.Types.ObjectId(userId),
        totalTime: testRecipe.prepTime + testRecipe.cookTime
      });
      recipeId = recipe._id.toString();
    });

    it('should get a recipe by ID', async () => {
      const res = await request(app)
        .get(`/api/recipes/${recipeId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id', recipeId);
      expect(res.body.title).toBe(testRecipe.title);
    });

    it('should return 404 for non-existent recipe', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/recipes/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid recipe ID', async () => {
      const res = await request(app)
        .get('/api/recipes/invalid-id');

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/recipes/:id', () => {
    let recipeId: string;

    beforeEach(async () => {
      // Create a test recipe
      const recipe = await Recipe.create({
        ...testRecipe,
        author: new mongoose.Types.ObjectId(userId),
        totalTime: testRecipe.prepTime + testRecipe.cookTime
      });
      recipeId = recipe._id.toString();
    });

    it('should update a recipe', async () => {
      const updatedRecipe = {
        ...testRecipe,
        title: 'Updated Recipe Title',
        description: 'Updated description'
      };

      const res = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .set('x-auth-token', token)
        .send(updatedRecipe);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Recipe Title');
      expect(res.body.description).toBe('Updated description');
    });

    it('should not update a recipe without authentication', async () => {
      const res = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .send({ ...testRecipe, title: 'New Title' });

      expect(res.status).toBe(401);
    });

    it('should not update another user\'s recipe', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'Password123!'
      });

      // Create recipe owned by another user
      const anotherRecipe = await Recipe.create({
        ...testRecipe,
        author: anotherUser._id,
        totalTime: testRecipe.prepTime + testRecipe.cookTime
      });

      const res = await request(app)
        .put(`/api/recipes/${anotherRecipe._id}`)
        .set('x-auth-token', token)
        .send({ ...testRecipe, title: 'New Title' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    let recipeId: string;

    beforeEach(async () => {
      // Create a test recipe
      const recipe = await Recipe.create({
        ...testRecipe,
        author: new mongoose.Types.ObjectId(userId),
        totalTime: testRecipe.prepTime + testRecipe.cookTime
      });
      recipeId = recipe._id.toString();
    });

    it('should delete a recipe', async () => {
      const res = await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Recipe removed');

      // Verify recipe was deleted
      const deletedRecipe = await Recipe.findById(recipeId);
      expect(deletedRecipe).toBeNull();
    });

    it('should not delete a recipe without authentication', async () => {
      const res = await request(app)
        .delete(`/api/recipes/${recipeId}`);

      expect(res.status).toBe(401);
    });

    it('should not delete another user\'s recipe', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'Password123!'
      });

      // Create recipe owned by another user
      const anotherRecipe = await Recipe.create({
        ...testRecipe,
        author: anotherUser._id,
        totalTime: testRecipe.prepTime + testRecipe.cookTime
      });

      const res = await request(app)
        .delete(`/api/recipes/${anotherRecipe._id}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/recipes/:id/like', () => {
    let recipeId: string;

    beforeEach(async () => {
      // Create a test recipe
      const recipe = await Recipe.create({
        ...testRecipe,
        author: new mongoose.Types.ObjectId(userId),
        totalTime: testRecipe.prepTime + testRecipe.cookTime
      });
      recipeId = recipe._id.toString();
    });

    it('should like a recipe', async () => {
      const res = await request(app)
        .post(`/api/recipes/${recipeId}/like`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      
      // Verify recipe has the like
      const likedRecipe = await Recipe.findById(recipeId);
      expect(likedRecipe!.likes).toHaveLength(1);
      expect(likedRecipe!.likes[0].toString()).toBe(userId);
    });

    it('should not like a recipe twice', async () => {
      // Like the recipe first
      await request(app)
        .post(`/api/recipes/${recipeId}/like`)
        .set('x-auth-token', token);

      // Try to like it again
      const res = await request(app)
        .post(`/api/recipes/${recipeId}/like`)
        .set('x-auth-token', token);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Recipe already liked');
    });
  });

  describe('POST /api/recipes/:id/unlike', () => {
    let recipeId: string;

    beforeEach(async () => {
      // Create a test recipe
      const recipe = await Recipe.create({
        ...testRecipe,
        author: new mongoose.Types.ObjectId(userId),
        likes: [new mongoose.Types.ObjectId(userId)], // Pre-like the recipe
        totalTime: testRecipe.prepTime + testRecipe.cookTime
      });
      recipeId = recipe._id.toString();
    });

    it('should unlike a recipe', async () => {
      const res = await request(app)
        .post(`/api/recipes/${recipeId}/unlike`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      
      // Verify recipe no longer has the like
      const unlikedRecipe = await Recipe.findById(recipeId);
      expect(unlikedRecipe!.likes).toHaveLength(0);
    });

    it('should not unlike a recipe that is not liked', async () => {
      // Unlike the recipe first
      await request(app)
        .post(`/api/recipes/${recipeId}/unlike`)
        .set('x-auth-token', token);

      // Try to unlike it again
      const res = await request(app)
        .post(`/api/recipes/${recipeId}/unlike`)
        .set('x-auth-token', token);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Recipe has not yet been liked');
    });
  });

  describe('GET /api/recipes/cuisines', () => {
    it('should get all cuisine types', async () => {
      const res = await request(app)
        .get('/api/recipes/cuisines');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toContain(Cuisine.ITALIAN);
      expect(res.body).toContain(Cuisine.CHINESE);
    });
  });

  describe('GET /api/recipes/equipment', () => {
    it('should get all equipment types', async () => {
      const res = await request(app)
        .get('/api/recipes/equipment');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toContain(Equipment.KNIFE);
      expect(res.body).toContain(Equipment.MIXING_BOWL);
    });
  });
}); 