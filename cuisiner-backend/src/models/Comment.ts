import mongoose, { Document } from 'mongoose';
import { Post } from './Post';

// Main Comment interface
export interface IComment extends Document {
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  likes: mongoose.Types.ObjectId[];
  parentComment?: mongoose.Types.ObjectId;  // For nested replies
  isEdited: boolean;
  
  // Methods
  deleteAndUpdateCount(): Promise<void>;
}

// Comment Schema
const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [400, 'Comment cannot be more than 400 characters']
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment', // for replies, reference the parent comment
    index: true
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
commentSchema.index({ post: 1, createdAt: -1 });  //  getting comments on a post
commentSchema.index({ parentComment: 1, createdAt: 1 });  // getting replies to a comment

// mongoose middleware to update comment count on Post when a comment is created
commentSchema.pre('save', async function(this: IComment, next) {
  try {
    // Only increment if this is a new comment (not an update)
    if (this.isNew) {
      await Post.findByIdAndUpdate(this.post, { $inc: { commentCount: 1 } }); // native mongoose method
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Define static methods interface
interface CommentModel extends mongoose.Model<IComment> {
  getPostComments(postId: mongoose.Types.ObjectId, limit?: number, skip?: number): Promise<IComment[]>;
  getCommentReplies(commentId: mongoose.Types.ObjectId, limit?: number, skip?: number): Promise<IComment[]>;
}

// Add document method to handle comment deletion
commentSchema.methods.deleteAndUpdateCount = async function(this: IComment): Promise<void> {
  // First decrement the comment count on the post
  await Post.findByIdAndUpdate(this.post, { $inc: { commentCount: -1 } });
  
  // Then delete the comment
  await this.deleteOne();
};

// static methods, called on the Comment itself, 
commentSchema.statics = {
  /** method one: get comments for a post
   * @param {ObjectId} postId -
   * @param {number} limit - max num of comments to return
   * @param {number} skip -num of comments to skip for pagination
   * @returns {Promise<IComment[]>}
   */
  getPostComments: function(postId: mongoose.Types.ObjectId, limit = 10, skip = 0) {
    return this.find({ 
      post: postId,
      parentComment: { $exists: false }  // this is to get top-level comments
    })
      .sort({ createdAt: -1 }) 
      .skip(skip) 
      .limit(limit) 
      .populate('user', 'username profilePicture') // populate the user field with the username and profile picture to display in the comment
      .exec();
  },

  /**
   * method two: get replies to a comment
   * @param {ObjectId} commentId
   * @param {number} limit
   * @param {number} skip
   * @returns {Promise<IComment[]>}
   */
  getCommentReplies: function(commentId: mongoose.Types.ObjectId, limit = 10, skip = 0) {
    return this.find({ parentComment: commentId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture')
      .exec();
  }
};

// Create and export the Comment model
export const Comment = mongoose.model<IComment, CommentModel>('Comment', commentSchema); 