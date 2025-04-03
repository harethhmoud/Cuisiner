import request from 'supertest';
import app from '../../server';
import { User } from '../../models/User';
import { Recipe, Cuisine, Equipment } from '../../models/Recipe';
import { Post } from '../../models/Post';
import mongoose from 'mongoose';
import '@jest/globals';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

describe('Post Routes', () => {
  let token: string;
  let userId: string;
  let recipeId: string;
  let postId: string;

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
    equipment: [Equipment.KNIFE, Equipment.MIXING_BOWL],
    totalTime: 30 // Adding totalTime to avoid validation errors
  };

  const testPost = {
    photos: ['https://example.com/post-photo.jpg'],
    caption: 'Test post caption',
    modifications: 'I added extra garlic'
  };

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Recipe.deleteMany({});
    await Post.deleteMany({});

    // Create a test user and get auth token
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    token = res.body.token;
    userId = res.body.user.id;

    // Create a test recipe
    const recipeRes = await request(app)
      .post('/api/recipes')
      .set('x-auth-token', token)
      .send(testRecipe);

    recipeId = recipeRes.body._id;
  });

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('x-auth-token', token)
        .send({
          ...testPost,
          recipe: recipeId
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.caption).toBe(testPost.caption);
      expect(res.body.photos).toEqual(testPost.photos);
      expect(res.body.author._id.toString()).toBe(userId);
      expect(res.body.recipe._id.toString()).toBe(recipeId);

      postId = res.body._id;
    });

    it('should not create a post without authentication', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({
          ...testPost,
          recipe: recipeId
        });

      expect(res.status).toBe(401);
    });

    it('should not create a post with invalid recipe ID', async () => {
      const invalidRecipeId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app)
        .post('/api/posts')
        .set('x-auth-token', token)
        .send({
          ...testPost,
          recipe: invalidRecipeId
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Recipe not found');
    });

    it('should not create a post without required fields', async () => {
      const invalidPost = { ...testPost, caption: '' };
      
      const res = await request(app)
        .post('/api/posts')
        .set('x-auth-token', token)
        .send({
          ...invalidPost,
          recipe: recipeId
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/posts', () => {
    beforeEach(async () => {
      // Create a test post
      const postRes = await request(app)
        .post('/api/posts')
        .set('x-auth-token', token)
        .send({
          ...testPost,
          recipe: recipeId
        });

      postId = postRes.body._id;
    });

    it('should get feed posts', async () => {
      const res = await request(app)
        .get('/api/posts')
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('posts');
      expect(res.body.posts).toHaveLength(1);
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('currentPage');
    });

    it('should not get feed posts without authentication', async () => {
      const res = await request(app)
        .get('/api/posts');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/posts/user/:userId', () => {
    beforeEach(async () => {
      // Create a test post
      const postRes = await request(app)
        .post('/api/posts')
        .set('x-auth-token', token)
        .send({
          ...testPost,
          recipe: recipeId
        });

      postId = postRes.body._id;
    });

    it('should get user posts', async () => {
      const res = await request(app)
        .get(`/api/posts/user/${userId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('posts');
      expect(res.body.posts).toHaveLength(1);
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('currentPage');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app)
        .get(`/api/posts/user/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/posts/:id', () => {
    beforeEach(async () => {
      // Create a test post
      const postRes = await request(app)
        .post('/api/posts')
        .set('x-auth-token', token)
        .send({
          ...testPost,
          recipe: recipeId
        });

      postId = postRes.body._id;
    });

    it('should get a post by ID', async () => {
      const res = await request(app)
        .get(`/api/posts/${postId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id', postId);
      expect(res.body.caption).toBe(testPost.caption);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app)
        .get(`/api/posts/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/posts/:id', () => {
    beforeEach(async () => {
      // Create a test post
      const postRes = await request(app)
        .post('/api/posts')
        .set('x-auth-token', token)
        .send({
          ...testPost,
          recipe: recipeId
        });

      postId = postRes.body._id;
    });

    it('should update a post', async () => {
      const updatedData = {
        photos: ['https://example.com/updated-photo.jpg'],
        caption: 'Updated caption',
        modifications: 'Updated modifications'
      };

      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('x-auth-token', token)
        .send(updatedData);

      expect(res.status).toBe(200);
      expect(res.body.caption).toBe(updatedData.caption);
      expect(res.body.photos).toEqual(updatedData.photos);
      expect(res.body.modifications).toBe(updatedData.modifications);
    });

    it('should not update a post without authentication', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .send({
          caption: 'Updated caption'
        });

      expect(res.status).toBe(401);
    });

    it('should not update another user\'s post', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'Password123!'
      });

      // Create post owned by another user
      const anotherPost = await Post.create({
        author: anotherUser._id,
        recipe: recipeId,
        photos: ['https://example.com/photo.jpg'],
        caption: 'Another user\'s post'
      });

      const res = await request(app)
        .put(`/api/posts/${anotherPost._id}`)
        .set('x-auth-token', token)
        .send({
          caption: 'Trying to update someone else\'s post'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    beforeEach(async () => {
      // Create a test post
      const postRes = await request(app)
        .post('/api/posts')
        .set('x-auth-token', token)
        .send({
          ...testPost,
          recipe: recipeId
        });

      postId = postRes.body._id;
    });

    it('should delete a post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Post removed');

      // Verify post was deleted
      const deletedPost = await Post.findById(postId);
      expect(deletedPost).toBeNull();
    });

    it('should not delete a post without authentication', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`);

      expect(res.status).toBe(401);
    });

    it('should not delete another user\'s post', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'Password123!'
      });

      // Create post owned by another user
      const anotherPost = await Post.create({
        author: anotherUser._id,
        recipe: recipeId,
        photos: ['https://example.com/photo.jpg'],
        caption: 'Another user\'s post'
      });

      const res = await request(app)
        .delete(`/api/posts/${anotherPost._id}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/posts/:id/like', () => {
    beforeEach(async () => {
      // Create a test post
      const postRes = await request(app)
        .post('/api/posts')
        .set('x-auth-token', token)
        .send({
          ...testPost,
          recipe: recipeId
        });

      postId = postRes.body._id;
    });

    it('should like a post', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      
      // Verify post has the like
      const likedPost = await Post.findById(postId);
      expect(likedPost!.likes).toHaveLength(1);
      expect(likedPost!.likes[0].toString()).toBe(userId);
    });

    it('should not like a post without authentication', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/like`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/posts/:id/unlike', () => {
    beforeEach(async () => {
      // Create a test post
      const postRes = await request(app)
        .post('/api/posts')
        .set('x-auth-token', token)
        .send({
          ...testPost,
          recipe: recipeId
        });

      postId = postRes.body._id;

      // Like the post
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('x-auth-token', token);
    });

    it('should unlike a post', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/unlike`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      
      // Verify post no longer has the like
      const unlikedPost = await Post.findById(postId);
      expect(unlikedPost!.likes).toHaveLength(0);
    });

    it('should not unlike a post without authentication', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/unlike`);

      expect(res.status).toBe(401);
    });
  });
}); 