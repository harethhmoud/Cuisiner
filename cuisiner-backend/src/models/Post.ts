import mongoose, { Document } from 'mongoose';

// Main Post interface
export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  recipe: mongoose.Types.ObjectId;  // reference to the recipe used
  photos: string[];  // URLs to photos of the cooked dish
  caption: string;
  date: Date;
  likes: mongoose.Types.ObjectId[];  // User IDs who liked this post
  commentCount: number;  // Number of comments on this post
  modifications?: string;  // Optional description of modifications made to the recipe
  
  // Methods
  like(userId: mongoose.Types.ObjectId): Promise<void>;
  unlike(userId: mongoose.Types.ObjectId): Promise<void>;
  isLikedBy(userId: mongoose.Types.ObjectId): boolean;
}

// Define model interface for static methods
interface PostModel extends mongoose.Model<IPost> {
  getFeed(userIds: mongoose.Types.ObjectId[], limit?: number, skip?: number): Promise<IPost[]>;
  getUserPosts(userId: mongoose.Types.ObjectId, limit?: number, skip?: number): Promise<IPost[]>;
}

// Post Schema
const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true,
    index: true
  },
  photos: [{
    type: String,  // URLs to photos stored in cloud storage
    required: [true, 'At least one photo is required']
  }],
  caption: {
    type: String,
    required: [true, 'Caption is required'],
    trim: true,
    maxlength: [500, 'Caption cannot be more than 500 characters']
  },
  date: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  modifications: {
    type: String,
    trim: true,
    maxlength: [500, 'Modifications description cannot be more than 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
postSchema.index({ createdAt: -1 });  // For sorting posts by newest first
postSchema.index({ author: 1, createdAt: -1 });  // For getting user's posts
postSchema.index({ recipe: 1, createdAt: -1 });  // For getting posts about a specific recipe

// object methods. called on post document itself.
postSchema.methods = {
  /**
   * method one: add a like to the post
   * @param {ObjectId} userId - The ID of the user liking the post
   */
  like: async function(this: IPost, userId: mongoose.Types.ObjectId): Promise<void> {
    // Check if already liked
    if (this.likes.includes(userId)) {
      return;
    }
    
    this.likes.push(userId);
    await this.save();
  },
  
  /**
   * method two: remove a like from the post
   * @param {ObjectId} userId - The ID of the user unliking the post
   */
  unlike: async function(this: IPost, userId: mongoose.Types.ObjectId): Promise<void> {
    this.likes = this.likes.filter(id => id.toString() !== userId.toString());
    await this.save();
  },
  
  /**
   * method three: check if a post is liked by a user
   * @param {ObjectId} userId - The ID of the user
   * @returns {boolean} - True if liked by the user
   */
  isLikedBy: function(this: IPost, userId: mongoose.Types.ObjectId): boolean {
    return this.likes.some(id => id.toString() === userId.toString());
  }
};

// Static methods
postSchema.statics = {
  /**
   * Get feed posts from followed users
   * @param {Array<ObjectId>} userIds - Array of user IDs (followed users)
   * @param {number} limit - Maximum number of posts to return
   * @param {number} skip - Number of posts to skip (for pagination)
   * @returns {Promise<IPost[]>}
   */
  getFeed: function(userIds: mongoose.Types.ObjectId[], limit = 10, skip = 0): Promise<IPost[]> {
    return this.find({ author: { $in: userIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profilePicture') // add stuff later to add gamification
      .populate('recipe', 'title date cuisine photos')
      .exec();
  },
  
  /**
   * Get posts by a specific user
   * @param {ObjectId} userId - The ID of the user
   * @param {number} limit - Maximum number of posts to return
   * @param {number} skip - Number of posts to skip (for pagination)
   * @returns {Promise<IPost[]>}
   */
  getUserPosts: function(userId: mongoose.Types.ObjectId, limit = 10, skip = 0): Promise<IPost[]> {
    return this.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('recipe', 'title date cuisine photos') // add stuff later to add gamification
      .exec();
  }
};

// Create and export the Post model
export const Post = mongoose.model<IPost, PostModel>('Post', postSchema); 