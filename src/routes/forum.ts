import express from 'express';
import { Post, Comment } from '../models/Forum';
import mongoose from 'mongoose';

const router = express.Router();

// Get all posts with optional filtering
router.get('/posts', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query: any = {};
    
    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }
    
    const posts = await Post.find(query)
      .populate('comments')
      .sort({ timestamp: -1 })
      .lean();
    
    // Transform posts to match frontend interface
    const transformedPosts = posts.map(post => ({
      ...post,
      _id: post._id.toString(),
      comments: post.comments || [],
      isLiked: false // This would be determined based on user session
    }));
    
    res.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new post
router.post('/posts', async (req, res) => {
  try {
    const { title, content, author, category, isAnonymous, tags } = req.body;
    
    // Generate avatar
    const avatar = isAnonymous ? 'AN' : author.substring(0, 2).toUpperCase();
    
    const post = new Post({
      title,
      content,
      author: isAnonymous ? 'Anonymous' : author,
      avatar,
      category,
      isAnonymous,
      tags: tags || []
    });
    
    const savedPost = await post.save();
    
    // Transform response to match frontend interface
    const transformedPost = {
      ...savedPost.toObject(),
      _id: (savedPost._id as mongoose.Types.ObjectId).toString(),
      comments: [],
      isLiked: false
    };
    
    res.status(201).json(transformedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Delete a post
router.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if user is the author of the post
    // For anonymous posts, we could check by userId if we stored it
    // For now, we'll allow deletion if the author matches the userId
    if (post.author !== userId && post.author !== 'Anonymous') {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }
    
    // Delete all comments associated with this post
    await Comment.deleteMany({ postId: id });
    
    // Delete the post
    await Post.findByIdAndDelete(id);
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like/Unlike a post
router.post('/posts/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const isLiked = post.likedBy.includes(userId);
    
    if (isLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter(id => id !== userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like
      post.likedBy.push(userId);
      post.likes += 1;
    }
    
    await post.save();
    res.json({ likes: post.likes, isLiked: !isLiked });
  } catch (error) {
    console.error('Error updating post like:', error);
    res.status(500).json({ error: 'Failed to update like' });
  }
});

// Unlike a post (DELETE method)
router.delete('/posts/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    post.likedBy = post.likedBy.filter(id => id !== userId);
    post.likes = Math.max(0, post.likes - 1);
    
    await post.save();
    res.json({ likes: post.likes, isLiked: false });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ error: 'Failed to unlike post' });
  }
});

// Get comments for a post
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    const comments = await Comment.find({ postId: id })
      .sort({ timestamp: 1 })
      .lean();
    
    // Transform comments to match frontend interface
    const transformedComments = comments.map(comment => ({
      ...comment,
      _id: comment._id.toString(),
      isLiked: false // This would be determined based on user session
    }));
    
    res.json(transformedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create a new comment
router.post('/comments', async (req, res) => {
  try {
    const { content, author, postId, isAnonymous } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Generate avatar
    const avatar = isAnonymous ? 'AN' : author.substring(0, 2).toUpperCase();
    
    const comment = new Comment({
      content,
      author: isAnonymous ? 'Anonymous' : author,
      avatar,
      postId,
      isAnonymous
    });
    
    const savedComment = await comment.save();
    
    // Add comment reference to post
    post.comments.push(savedComment._id as mongoose.Types.ObjectId);
    await post.save();
    
    // Transform response to match frontend interface
    const transformedComment = {
      ...savedComment.toObject(),
      _id: (savedComment._id as mongoose.Types.ObjectId).toString(),
      isLiked: false
    };
    
    res.status(201).json(transformedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Like/Unlike a comment
router.post('/comments/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }
    
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const isLiked = comment.likedBy.includes(userId);
    
    if (isLiked) {
      // Unlike
      comment.likedBy = comment.likedBy.filter(id => id !== userId);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      // Like
      comment.likedBy.push(userId);
      comment.likes += 1;
    }
    
    await comment.save();
    res.json({ likes: comment.likes, isLiked: !isLiked });
  } catch (error) {
    console.error('Error updating comment like:', error);
    res.status(500).json({ error: 'Failed to update like' });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'Academic Stress',
      'Anxiety',
      'Depression',
      'Sleep Issues',
      'Social Life',
      'Relationship',
      'Self Care',
      'Study Tips',
      'General Support'
    ];
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;