"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = exports.Post = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PostSchema = new mongoose_1.Schema({
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
            type: mongoose_1.Schema.Types.ObjectId,
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
const CommentSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
exports.Post = mongoose_1.default.model('Post', PostSchema);
exports.Comment = mongoose_1.default.model('Comment', CommentSchema);
