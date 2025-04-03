import request from 'supertest';
import app from '../../server';
import { User } from '../../models/User';
import { Recipe, Cuisine, Equipment } from '../../models/Recipe';
import { Post } from '../../models/Post';
import { Comment } from '../../models/Comment';
import mongoose from 'mongoose';
import '@jest/globals';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

describe('Comment Routes', () => {
  let token: string;
  let userId: string;
  let recipeId: string;
  let postId: string;
  let commentId: string;

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

  const testComment = {
    content: 'This looks delicious!'
  };

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Recipe.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});

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

  describe('POST /api/comments/post/:postId', () => {
    it('should create a comment on a post', async () => {
      const res = await request(app)
        .post(`/api/comments/post/${postId}`)
        .set('x-auth-token', token)
        .send(testComment);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.content).toBe(testComment.content);
      expect(res.body.user._id.toString()).toBe(userId);
      expect(res.body.post.toString()).toBe(postId);

      commentId = res.body._id;

      // Verify post comment count increased
      const updatedPost = await Post.findById(postId);
      expect(updatedPost!.commentCount).toBe(1);
    });

    it('should not create a comment without authentication', async () => {
      const res = await request(app)
        .post(`/api/comments/post/${postId}`)
        .send(testComment);

      expect(res.status).toBe(401);
    });

    it('should not create a comment with invalid post ID', async () => {
      const invalidPostId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app)
        .post(`/api/comments/post/${invalidPostId}`)
        .set('x-auth-token', token)
        .send(testComment);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Post not found');
    });

    it('should not create a comment without content', async () => {
      const invalidComment = { content: '' };
      
      const res = await request(app)
        .post(`/api/comments/post/${postId}`)
        .set('x-auth-token', token)
        .send(invalidComment);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/comments/post/:postId', () => {
    beforeEach(async () => {
      // Create a test comment
      const commentRes = await request(app)
        .post(`/api/comments/post/${postId}`)
        .set('x-auth-token', token)
        .send(testComment);

      commentId = commentRes.body._id;
    });

    it('should get comments for a post', async () => {
      const res = await request(app)
        .get(`/api/comments/post/${postId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('comments');
      expect(res.body.comments).toHaveLength(1);
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('currentPage');
      expect(res.body.comments[0].content).toBe(testComment.content);
    });

    it('should not get comments for invalid post ID', async () => {
      const invalidPostId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app)
        .get(`/api/comments/post/${invalidPostId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/comments/:commentId/reply', () => {
    beforeEach(async () => {
      // Create a test comment
      const commentRes = await request(app)
        .post(`/api/comments/post/${postId}`)
        .set('x-auth-token', token)
        .send(testComment);

      commentId = commentRes.body._id;
    });

    it('should create a reply to a comment', async () => {
      const replyContent = { content: 'This is a reply' };
      
      const res = await request(app)
        .post(`/api/comments/${commentId}/reply`)
        .set('x-auth-token', token)
        .send(replyContent);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.content).toBe(replyContent.content);
      expect(res.body.user._id.toString()).toBe(userId);
      expect(res.body.post.toString()).toBe(postId);
      expect(res.body.parentComment.toString()).toBe(commentId);

      // Verify post comment count increased
      const updatedPost = await Post.findById(postId);
      expect(updatedPost!.commentCount).toBe(2);
    });

    it('should not create a reply without authentication', async () => {
      const replyContent = { content: 'This is a reply' };
      
      const res = await request(app)
        .post(`/api/comments/${commentId}/reply`)
        .send(replyContent);

      expect(res.status).toBe(401);
    });

    it('should not create a reply with invalid comment ID', async () => {
      const invalidCommentId = new mongoose.Types.ObjectId().toString();
      const replyContent = { content: 'This is a reply' };
      
      const res = await request(app)
        .post(`/api/comments/${invalidCommentId}/reply`)
        .set('x-auth-token', token)
        .send(replyContent);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Comment not found');
    });
  });

  describe('GET /api/comments/:commentId/replies', () => {
    let replyId: string;

    beforeEach(async () => {
      // Create a test comment
      const commentRes = await request(app)
        .post(`/api/comments/post/${postId}`)
        .set('x-auth-token', token)
        .send(testComment);

      commentId = commentRes.body._id;

      // Create a reply
      const replyContent = { content: 'This is a reply' };
      const replyRes = await request(app)
        .post(`/api/comments/${commentId}/reply`)
        .set('x-auth-token', token)
        .send(replyContent);

      replyId = replyRes.body._id;
    });

    it('should get replies to a comment', async () => {
      const res = await request(app)
        .get(`/api/comments/${commentId}/replies`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('replies');
      expect(res.body.replies).toHaveLength(1);
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('currentPage');
      expect(res.body.replies[0].content).toBe('This is a reply');
    });

    it('should not get replies for invalid comment ID', async () => {
      const invalidCommentId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app)
        .get(`/api/comments/${invalidCommentId}/replies`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/comments/:id', () => {
    beforeEach(async () => {
      // Create a test comment
      const commentRes = await request(app)
        .post(`/api/comments/post/${postId}`)
        .set('x-auth-token', token)
        .send(testComment);

      commentId = commentRes.body._id;
    });

    it('should update a comment', async () => {
      const updatedContent = { content: 'Updated comment content' };
      
      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('x-auth-token', token)
        .send(updatedContent);

      expect(res.status).toBe(200);
      expect(res.body.content).toBe(updatedContent.content);
      expect(res.body.isEdited).toBe(true);
    });

    it('should not update a comment without authentication', async () => {
      const updatedContent = { content: 'Updated comment content' };
      
      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .send(updatedContent);

      expect(res.status).toBe(401);
    });

    it('should not update another user\'s comment', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'Password123!'
      });

      // Create comment owned by another user
      const anotherComment = await Comment.create({
        user: anotherUser._id,
        post: postId,
        content: 'Another user\'s comment'
      });

      const updatedContent = { content: 'Trying to update someone else\'s comment' };
      
      const res = await request(app)
        .put(`/api/comments/${anotherComment._id}`)
        .set('x-auth-token', token)
        .send(updatedContent);

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/comments/:id', () => {
    beforeEach(async () => {
      // Create a test comment
      const commentRes = await request(app)
        .post(`/api/comments/post/${postId}`)
        .set('x-auth-token', token)
        .send(testComment);

      commentId = commentRes.body._id;
    });

    it('should delete a comment', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Comment removed');

      // Verify comment was deleted
      const deletedComment = await Comment.findById(commentId);
      expect(deletedComment).toBeNull();

      // Verify post comment count decreased
      const updatedPost = await Post.findById(postId);
      expect(updatedPost!.commentCount).toBe(0);
    });

    it('should not delete a comment without authentication', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentId}`);

      expect(res.status).toBe(401);
    });

    it('should not delete another user\'s comment', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'Password123!'
      });

      // Create comment owned by another user
      const anotherComment = await Comment.create({
        user: anotherUser._id,
        post: postId,
        content: 'Another user\'s comment'
      });

      const res = await request(app)
        .delete(`/api/comments/${anotherComment._id}`)
        .set('x-auth-token', token);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/comments/:id/like', () => {
    beforeEach(async () => {
      // Create a test comment
      const commentRes = await request(app)
        .post(`/api/comments/post/${postId}`)
        .set('x-auth-token', token)
        .send(testComment);

      commentId = commentRes.body._id;
    });

    it('should like a comment', async () => {
      const res = await request(app)
        .post(`/api/comments/${commentId}/like`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      
      // Verify comment has the like
      const likedComment = await Comment.findById(commentId);
      expect(likedComment!.likes).toHaveLength(1);
      expect(likedComment!.likes[0].toString()).toBe(userId);
    });

    it('should not like a comment without authentication', async () => {
      const res = await request(app)
        .post(`/api/comments/${commentId}/like`);

      expect(res.status).toBe(401);
    });

    it('should not like a comment twice', async () => {
      // Like the comment first
      await request(app)
        .post(`/api/comments/${commentId}/like`)
        .set('x-auth-token', token);
      
      // Try to like it again
      const res = await request(app)
        .post(`/api/comments/${commentId}/like`)
        .set('x-auth-token', token);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/comments/:id/unlike', () => {
    beforeEach(async () => {
      // Create a test comment
      const commentRes = await request(app)
        .post(`/api/comments/post/${postId}`)
        .set('x-auth-token', token)
        .send(testComment);

      commentId = commentRes.body._id;

      // Like the comment
      await request(app)
        .post(`/api/comments/${commentId}/like`)
        .set('x-auth-token', token);
    });

    it('should unlike a comment', async () => {
      const res = await request(app)
        .post(`/api/comments/${commentId}/unlike`)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      
      // Verify comment no longer has the like
      const unlikedComment = await Comment.findById(commentId);
      expect(unlikedComment!.likes).toHaveLength(0);
    });

    it('should not unlike a comment without authentication', async () => {
      const res = await request(app)
        .post(`/api/comments/${commentId}/unlike`);

      expect(res.status).toBe(401);
    });

    it('should not unlike a comment that is not liked', async () => {
      // Unlike the comment first
      await request(app)
        .post(`/api/comments/${commentId}/unlike`)
        .set('x-auth-token', token);
      
      // Try to unlike it again
      const res = await request(app)
        .post(`/api/comments/${commentId}/unlike`)
        .set('x-auth-token', token);

      expect(res.status).toBe(400);
    });
  });
}); 