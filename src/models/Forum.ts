import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  author: string;
  avatar: string;
  category: string;
  likes: number;
  likedBy: string[];
  comments: mongoose.Types.ObjectId[];
  timestamp: Date;
  isAnonymous: boolean;
  tags: string[];
  isModerated: boolean;
}

export interface IComment extends Document {
  content: string;
  author: string;
  avatar: string;
  postId: mongoose.Types.ObjectId;
  likes: number;
  likedBy: string[];
  timestamp: Date;
  isAnonymous: boolean;
  isModerated: boolean;
}

const PostSchema = new Schema<IPost>({
  title: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 200,
    trim: true
  },
  content: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 2000,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Academic Stress',
      'Anxiety',
      'Depression',
      'Sleep Issues',
      'Social Life',
      'Relationship',
      'Self Care',
      'Study Tips',
      'General Support'
    ]
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  likedBy: [{
    type: String
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  isModerated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const CommentSchema = new Schema<IComment>({
  content: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 500,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    required: true
  },
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  likedBy: [{
    type: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isModerated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
PostSchema.index({ category: 1, timestamp: -1 });
PostSchema.index({ title: 'text', content: 'text', tags: 'text' });
CommentSchema.index({ postId: 1, timestamp: -1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);
export const Comment = mongoose.model<IComment>('Comment', CommentSchema);