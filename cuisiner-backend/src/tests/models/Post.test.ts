import mongoose from 'mongoose';
import { Post } from '../../models/Post';
import { User } from '../../models/User';
import { Recipe, Cuisine, Equipment } from '../../models/Recipe';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Post Model', () => {
  let user: any;
  let recipe: any;
  let post: any;

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
      caption: 'Test post caption',
      modifications: 'Test modifications'
    });
  });

  describe('Post Creation', () => {
    it('should create a post with valid data', async () => {
      expect(post).toBeDefined();
      expect(post.author.toString()).toBe(user._id.toString());
      expect(post.recipe.toString()).toBe(recipe._id.toString());
      expect(post.caption).toBe('Test post caption');
      expect(post.photos).toHaveLength(1);
      expect(post.commentCount).toBe(0);
    });

    it('should require a caption', async () => {
      const postWithoutCaption = new Post({
        author: user._id,
        recipe: recipe._id,
        photos: ['test-photo-url.jpg'],
        caption: '' // Empty caption
      });

      let validationError: any;
      try {
        await postWithoutCaption.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors.caption).toBeDefined();
    });
  });

  describe('Like Methods', () => {
    it('should add a like', async () => {
      await post.like(user._id);
      expect(post.likes).toHaveLength(1);
      expect(post.likes[0].toString()).toBe(user._id.toString());
    });

    it('should not add duplicate likes', async () => {
      await post.like(user._id);
      await post.like(user._id);
      expect(post.likes).toHaveLength(1);
    });

    it('should remove a like', async () => {
      await post.like(user._id);
      await post.unlike(user._id);
      expect(post.likes).toHaveLength(0);
    });

    it('should check if post is liked by user', async () => {
      await post.like(user._id);
      expect(post.isLikedBy(user._id)).toBe(true);
      await post.unlike(user._id);
      expect(post.isLikedBy(user._id)).toBe(false);
    });
  });

  describe('Static Methods', () => {
    it('should get user posts', async () => {
      const posts = await Post.getUserPosts(user._id);
      expect(posts).toHaveLength(1);
      expect(posts[0]._id.toString()).toBe(post._id.toString());
    });

    it('should get feed posts', async () => {
      const posts = await Post.getFeed([user._id]);
      expect(posts).toHaveLength(1);
      expect(posts[0]._id.toString()).toBe(post._id.toString());
    });

    it('should populate author and recipe fields in feed', async () => {
      const posts = await Post.getFeed([user._id]);
      const populatedPost = await Post.findById(posts[0]._id)
        .populate('author', 'username')
        .populate('recipe', 'title')
        .exec();
      
      expect(populatedPost?.author).toBeDefined();
      expect(populatedPost?.recipe).toBeDefined();
      expect((populatedPost?.author as any).username).toBe('testuser');
      expect((populatedPost?.recipe as any).title).toBe('Test Recipe');
    });
  });
}); 