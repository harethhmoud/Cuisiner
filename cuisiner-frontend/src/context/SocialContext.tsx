import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PostService from '../services/post.service';
import { useAuth } from './AuthContext';
import { Post, PaginatedResponse } from '../types';

// Define the context types
interface SocialContextType {
  posts: Post[];
  userPosts: Post[];
  selectedPost: Post | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  
  // Methods
  fetchFeedPosts: (page?: number, limit?: number) => Promise<void>;
  fetchUserPosts: (userId: string, page?: number, limit?: number) => Promise<void>;
  fetchPostById: (id: string) => Promise<Post | null>;
  setSelectedPost: (post: Post | null) => void;
  createPost: (postData: {
    recipe: string;
    photos: string[];
    caption: string;
    modifications?: string;
  }) => Promise<Post | null>;
  updatePost: (id: string, updateData: Partial<Pick<Post, 'caption' | 'modifications'>>) => Promise<Post | null>;
  deletePost: (id: string) => Promise<boolean>;
  likePost: (id: string) => Promise<void>;
  unlikePost: (id: string) => Promise<void>;
  isPostLiked: (post: Post) => boolean;
}

// Create the context with a default value
const SocialContext = createContext<SocialContextType>({
  posts: [],
  userPosts: [],
  selectedPost: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  
  fetchFeedPosts: async () => {},
  fetchUserPosts: async () => {},
  fetchPostById: async () => null,
  setSelectedPost: () => {},
  createPost: async () => null,
  updatePost: async () => null,
  deletePost: async () => false,
  likePost: async () => {},
  unlikePost: async () => {},
  isPostLiked: () => false,
});

// Custom hook to use the social context
export const useSocial = () => useContext(SocialContext);

// Provider component that wraps the app and provides the social context
export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Fetch feed posts (posts from followed users)
  const fetchFeedPosts = useCallback(async (page = 1, limit = 10) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await PostService.getFeedPosts(page, limit);
      setPosts(response.data);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch feed posts');
      console.error('Error fetching feed posts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch posts by a specific user
  const fetchUserPosts = useCallback(async (userId: string, page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await PostService.getUserPosts(userId, page, limit);
      setUserPosts(response.data);
    } catch (err: any) {
      setError(err.message || `Failed to fetch posts for user: ${userId}`);
      console.error(`Error fetching posts for user ${userId}:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single post by ID
  const fetchPostById = async (id: string): Promise<Post | null> => {
    setLoading(true);
    setError(null);
    try {
      const post = await PostService.getPostById(id);
      return post;
    } catch (err: any) {
      setError(err.message || `Failed to fetch post with ID: ${id}`);
      console.error(`Error fetching post with ID ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new post
  const createPost = async (postData: {
    recipe: string;
    photos: string[];
    caption: string;
    modifications?: string;
  }): Promise<Post | null> => {
    setLoading(true);
    setError(null);
    try {
      const newPost = await PostService.createPost(postData);
      
      // Add the new post to the feed if it's the current user's post
      if (user && typeof newPost.author === 'string' && newPost.author === user._id) {
        setPosts(prevPosts => [newPost, ...prevPosts]);
        setUserPosts(prevPosts => [newPost, ...prevPosts]);
      }
      
      return newPost;
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
      console.error('Error creating post:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing post
  const updatePost = async (
    id: string,
    updateData: Partial<Pick<Post, 'caption' | 'modifications'>>
  ): Promise<Post | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedPost = await PostService.updatePost(id, updateData);
      
      // Update the post in our state
      setPosts(prevPosts =>
        prevPosts.map(post => (post._id === id ? updatedPost : post))
      );
      
      setUserPosts(prevPosts =>
        prevPosts.map(post => (post._id === id ? updatedPost : post))
      );
      
      // Update selected post if it's the one that was updated
      if (selectedPost && selectedPost._id === id) {
        setSelectedPost(updatedPost);
      }
      
      return updatedPost;
    } catch (err: any) {
      setError(err.message || `Failed to update post with ID: ${id}`);
      console.error(`Error updating post with ID ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a post
  const deletePost = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await PostService.deletePost(id);
      
      // Remove the post from our state
      setPosts(prevPosts => prevPosts.filter(post => post._id !== id));
      setUserPosts(prevPosts => prevPosts.filter(post => post._id !== id));
      
      // Clear selected post if it's the one that was deleted
      if (selectedPost && selectedPost._id === id) {
        setSelectedPost(null);
      }
      
      return true;
    } catch (err: any) {
      setError(err.message || `Failed to delete post with ID: ${id}`);
      console.error(`Error deleting post with ID ${id}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Like a post
  const likePost = async (id: string) => {
    if (!user) return;
    
    try {
      await PostService.likePost(id);
      
      // Update the posts to reflect the like
      const updatePostLikes = (post: Post) => {
        if (post._id === id) {
          return {
            ...post,
            likes: [...post.likes, user._id]
          };
        }
        return post;
      };
      
      setPosts(prevPosts => prevPosts.map(updatePostLikes));
      setUserPosts(prevPosts => prevPosts.map(updatePostLikes));
      
      // Update selected post if it's the one that was liked
      if (selectedPost && selectedPost._id === id) {
        setSelectedPost(updatePostLikes(selectedPost));
      }
    } catch (err: any) {
      setError(err.message || `Failed to like post with ID: ${id}`);
      console.error(`Error liking post with ID ${id}:`, err);
    }
  };

  // Unlike a post
  const unlikePost = async (id: string) => {
    if (!user) return;
    
    try {
      await PostService.unlikePost(id);
      
      // Update the posts to reflect the unlike
      const updatePostUnlikes = (post: Post) => {
        if (post._id === id) {
          return {
            ...post,
            likes: post.likes.filter(userId => userId !== user._id)
          };
        }
        return post;
      };
      
      setPosts(prevPosts => prevPosts.map(updatePostUnlikes));
      setUserPosts(prevPosts => prevPosts.map(updatePostUnlikes));
      
      // Update selected post if it's the one that was unliked
      if (selectedPost && selectedPost._id === id) {
        setSelectedPost(updatePostUnlikes(selectedPost));
      }
    } catch (err: any) {
      setError(err.message || `Failed to unlike post with ID: ${id}`);
      console.error(`Error unliking post with ID ${id}:`, err);
    }
  };

  // Check if a post is liked by the current user
  const isPostLiked = (post: Post): boolean => {
    if (!user || !post) return false;
    return post.likes.includes(user._id);
  };

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchFeedPosts();
    }
  }, [user, fetchFeedPosts]);

  // Create the value object with all the methods and state
  const value = {
    posts,
    userPosts,
    selectedPost,
    loading,
    error,
    totalPages,
    currentPage,
    
    fetchFeedPosts,
    fetchUserPosts,
    fetchPostById,
    setSelectedPost,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    isPostLiked,
  };

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}; 