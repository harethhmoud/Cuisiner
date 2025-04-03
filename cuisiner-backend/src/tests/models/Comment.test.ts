import mongoose from 'mongoose';
import { Comment } from '../../models/Comment';
import { Post } from '../../models/Post';
import { User } from '../../models/User';
import { Recipe, Cuisine, Equipment } from '../../models/Recipe';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Comment Model', () => {
  let user: any;
  let recipe: any;
  let post: any;
  let comment: any;

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

    // Create test post
    post = await Post.create({
      author: user._id,
      recipe: recipe._id,
      photos: ['test-photo-url.jpg'],
      caption: 'Test post caption'
    });

    // Create test comment
    comment = await Comment.create({
      post: post._id,
      user: user._id,
      content: 'Test comment'
    });
  });

  describe('Comment Creation', () => {
    it('should create a comment with valid data', async () => {
      expect(comment).toBeDefined();
      expect(comment.post.toString()).toBe(post._id.toString());
      expect(comment.user.toString()).toBe(user._id.toString());
      expect(comment.content).toBe('Test comment');
      expect(comment.isEdited).toBe(false);
    });

    it('should require content', async () => {
      const commentWithoutContent = new Comment({
        post: post._id,
        user: user._id
      });

      await expect(commentWithoutContent.save()).rejects.toThrow();
    });

    it('should limit content length to 400 characters', async () => {
      const longComment = new Comment({
        post: post._id,
        user: user._id,
        content: 'a'.repeat(401)
      });

      await expect(longComment.save()).rejects.toThrow();
    });
  });

  describe('Comment Count Synchronization', () => {
    it('should increment post comment count on creation', async () => {
      const postAfterComment = await Post.findById(post._id);
      expect(postAfterComment?.commentCount).toBe(1);
    });

    it('should decrement post comment count on deletion', async () => {
      await comment.deleteAndUpdateCount();
      const postAfterDeletion = await Post.findById(post._id);
      expect(postAfterDeletion?.commentCount).toBe(0);
    });
  });

  describe('Static Methods', () => {
    it('should get post comments', async () => {
      const comments = await Comment.getPostComments(post._id);
      expect(comments).toHaveLength(1);
      expect(comments[0]._id.toString()).toBe(comment._id.toString());
    });

    it('should get comment replies', async () => {
      const reply = await Comment.create({
        post: post._id,
        user: user._id,
        content: 'Test reply',
        parentComment: comment._id
      });

      const replies = await Comment.getCommentReplies(comment._id);
      expect(replies).toHaveLength(1);
      expect(replies[0]._id.toString()).toBe(reply._id.toString());
    });

    it('should populate user fields in queries', async () => {
      const comments = await Comment.getPostComments(post._id);
      const populatedComment = await Comment.findById(comments[0]._id)
        .populate('user', 'username')
        .exec();
      
      expect(populatedComment?.user).toBeDefined();
      expect((populatedComment?.user as any).username).toBe('testuser');
    });
  });

  describe('Nested Comments', () => {
    it('should support nested replies', async () => {
      const reply = await Comment.create({
        post: post._id,
        user: user._id,
        content: 'Test reply',
        parentComment: comment._id
      });

      expect(reply.parentComment?.toString()).toBe(comment._id.toString());
    });

    it('should only return top-level comments in getPostComments', async () => {
      await Comment.create({
        post: post._id,
        user: user._id,
        content: 'Test reply',
        parentComment: comment._id
      });

      const comments = await Comment.getPostComments(post._id);
      expect(comments).toHaveLength(1); // Only the top-level comment
    });
  });
}); 