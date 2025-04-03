import request from 'supertest';
import app from '../../server';
import { User } from '../../models/User';
import { Recipe, Cuisine, Equipment } from '../../models/Recipe';
import mongoose from 'mongoose';
import '@jest/globals';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

describe('User Routes', () => {
  let token: string;
  let userId: string;
  let recipeId: string;
  let anotherToken: string;
  let anotherUserId: string;

  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!'
  };

  const anotherTestUser = {
    username: 'anotheruser',
    email: 'another@example.com',
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
    equipment: [Equipment.KNIFE, Equipment.MIXING_BOWL],
    totalTime: 30 // Adding totalTime to avoid validation errors
  };

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Recipe.deleteMany({});

    // Create test users and get auth tokens
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    token = res.body.token;
    userId = res.body.user.id;

    const anotherRes = await request(app)
      .post('/api/auth/register')
      .send(anotherTestUser);

    anotherToken = anotherRes.body.token;
    anotherUserId = anotherRes.body.user.id;

    // Create a test recipe
    const recipeRes = await request(app)
      .post('/api/recipes')
      .set('x-auth-token', token)
      .send(testRecipe);

    recipeId = recipeRes.body._id;
  });

  describe('GET /api/users/profile/:userId', () => {
    it('should get a user profile by ID', async () => {
      const res = await request(app)
        .get(`/api/users/profile/${userId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('username', testUser.username);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app)
        .get(`/api/users/profile/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const updatedProfile = {
        profilePicture: 'https://example.com/profile.jpg',
        bio: 'I love cooking!'
      };
      
      const res = await request(app)
        .put('/api/users/profile')
        .set('x-auth-token', token)
        .send(updatedProfile);

      expect(res.status).toBe(200);
      expect(res.body.profilePicture).toBe(updatedProfile.profilePicture);
      expect(res.body.bio).toBe(updatedProfile.bio);
    });

    it('should not update profile without authentication', async () => {
      const updatedProfile = {
        bio: 'I love cooking!'
      };
      
      const res = await request(app)
        .put('/api/users/profile')
        .send(updatedProfile);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/users/follow/:userId', () => {
    it('should follow another user', async () => {
      const res = await request(app)
        .post(`/api/users/follow/${anotherUserId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Successfully followed user');

      // Verify following/followers lists updated
      const user = await User.findById(userId);
      const anotherUser = await User.findById(anotherUserId);
      
      expect(user!.following).toHaveLength(1);
      expect(user!.following[0].toString()).toBe(anotherUserId);
      
      expect(anotherUser!.followers).toHaveLength(1);
      expect(anotherUser!.followers[0].toString()).toBe(userId);
    });

    it('should not follow without authentication', async () => {
      const res = await request(app)
        .post(`/api/users/follow/${anotherUserId}`);

      expect(res.status).toBe(401);
    });

    it('should not follow yourself', async () => {
      const res = await request(app)
        .post(`/api/users/follow/${userId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'You cannot follow yourself');
    });

    it('should not follow a non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app)
        .post(`/api/users/follow/${fakeId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(404);
    });

    it('should not follow a user twice', async () => {
      // Follow first
      await request(app)
        .post(`/api/users/follow/${anotherUserId}`)
        .set('x-auth-token', token);

      // Try to follow again
      const res = await request(app)
        .post(`/api/users/follow/${anotherUserId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Already following this user');
    });
  });

  describe('POST /api/users/unfollow/:userId', () => {
    beforeEach(async () => {
      // Follow user first
      await request(app)
        .post(`/api/users/follow/${anotherUserId}`)
        .set('x-auth-token', token);
    });

    it('should unfollow a user', async () => {
      const res = await request(app)
        .post(`/api/users/unfollow/${anotherUserId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Successfully unfollowed user');

      // Verify following/followers lists updated
      const user = await User.findById(userId);
      const anotherUser = await User.findById(anotherUserId);
      
      expect(user!.following).toHaveLength(0);
      expect(anotherUser!.followers).toHaveLength(0);
    });

    it('should not unfollow without authentication', async () => {
      const res = await request(app)
        .post(`/api/users/unfollow/${anotherUserId}`);

      expect(res.status).toBe(401);
    });

    it('should not unfollow a non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app)
        .post(`/api/users/unfollow/${fakeId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(404);
    });

    it('should not unfollow a user who is not followed', async () => {
      // Unfollow first
      await request(app)
        .post(`/api/users/unfollow/${anotherUserId}`)
        .set('x-auth-token', token);

      // Try to unfollow again
      const res = await request(app)
        .post(`/api/users/unfollow/${anotherUserId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Not following this user');
    });
  });

  describe('GET /api/users/followers', () => {
    beforeEach(async () => {
      // Have another user follow test user
      await request(app)
        .post(`/api/users/follow/${userId}`)
        .set('x-auth-token', anotherToken);
    });

    it('should get user followers', async () => {
      const res = await request(app)
        .get('/api/users/followers')
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].username).toBe(anotherTestUser.username);
    });

    it('should not get followers without authentication', async () => {
      const res = await request(app)
        .get('/api/users/followers');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/following', () => {
    beforeEach(async () => {
      // Have test user follow another user
      await request(app)
        .post(`/api/users/follow/${anotherUserId}`)
        .set('x-auth-token', token);
    });

    it('should get users the current user is following', async () => {
      const res = await request(app)
        .get('/api/users/following')
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].username).toBe(anotherTestUser.username);
    });

    it('should not get following without authentication', async () => {
      const res = await request(app)
        .get('/api/users/following');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/users/save-recipe/:recipeId', () => {
    it('should save a recipe', async () => {
      const res = await request(app)
        .post(`/api/users/save-recipe/${recipeId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Recipe saved successfully');

      // Verify recipe is saved
      const user = await User.findById(userId);
      expect(user!.savedRecipes).toHaveLength(1);
      expect(user!.savedRecipes[0].toString()).toBe(recipeId);
    });

    it('should not save a recipe without authentication', async () => {
      const res = await request(app)
        .post(`/api/users/save-recipe/${recipeId}`);

      expect(res.status).toBe(401);
    });

    it('should not save a non-existent recipe', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app)
        .post(`/api/users/save-recipe/${fakeId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(404);
    });

    it('should not save a recipe twice', async () => {
      // Save recipe first
      await request(app)
        .post(`/api/users/save-recipe/${recipeId}`)
        .set('x-auth-token', token);

      // Try to save it again
      const res = await request(app)
        .post(`/api/users/save-recipe/${recipeId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Recipe already saved');
    });
  });

  describe('POST /api/users/unsave-recipe/:recipeId', () => {
    beforeEach(async () => {
      // Save recipe first
      await request(app)
        .post(`/api/users/save-recipe/${recipeId}`)
        .set('x-auth-token', token);
    });

    it('should unsave a recipe', async () => {
      const res = await request(app)
        .post(`/api/users/unsave-recipe/${recipeId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Recipe unsaved successfully');

      // Verify recipe is unsaved
      const user = await User.findById(userId);
      expect(user!.savedRecipes).toHaveLength(0);
    });

    it('should not unsave a recipe without authentication', async () => {
      const res = await request(app)
        .post(`/api/users/unsave-recipe/${recipeId}`);

      expect(res.status).toBe(401);
    });

    it('should not unsave a recipe that is not saved', async () => {
      // Unsave recipe first
      await request(app)
        .post(`/api/users/unsave-recipe/${recipeId}`)
        .set('x-auth-token', token);

      // Try to unsave it again
      const res = await request(app)
        .post(`/api/users/unsave-recipe/${recipeId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Recipe not saved');
    });
  });

  describe('GET /api/users/saved-recipes', () => {
    beforeEach(async () => {
      // Save recipe first
      await request(app)
        .post(`/api/users/save-recipe/${recipeId}`)
        .set('x-auth-token', token);
    });

    it('should get saved recipes', async () => {
      const res = await request(app)
        .get('/api/users/saved-recipes')
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('recipes');
      expect(res.body.recipes).toHaveLength(1);
      expect(res.body.recipes[0]._id.toString()).toBe(recipeId);
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('currentPage');
    });

    it('should not get saved recipes without authentication', async () => {
      const res = await request(app)
        .get('/api/users/saved-recipes');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/search', () => {
    it('should search for users by username', async () => {
      const res = await request(app)
        .get('/api/users/search')
        .query({ query: 'test' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0].username).toBe(testUser.username);
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('currentPage');
    });

    it('should return empty array for no matches', async () => {
      const res = await request(app)
        .get('/api/users/search')
        .query({ query: 'nonexistentuser' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body.users).toHaveLength(0);
    });

    it('should require a search query', async () => {
      const res = await request(app)
        .get('/api/users/search');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Search query is required');
    });
  });
}); 