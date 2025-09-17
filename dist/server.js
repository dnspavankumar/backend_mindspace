"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const forum_1 = __importDefault(require("./routes/forum"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    process.exit(1);
}
// Security middleware
app.use((0, helmet_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);
// CORS configuration
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        /\.vercel\.app$/ // Allow all vercel.app subdomains
    ],
    credentials: true,
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Routes
app.use('/api/forum', forum_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: mongoose_1.default.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        timestamp: new Date().toISOString()
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Database connection
const connectDB = async () => {
    try {
        console.log('🔄 Connecting to MongoDB Atlas...');
        // Check if MONGODB_URI contains obvious placeholder values (exact matches only)
        if (MONGODB_URI === 'mongodb+srv://username:password@cluster.mongodb.net/mindspace?retryWrites=true&w=majority' ||
            MONGODB_URI.includes('username:password@cluster.mongodb.net') ||
            MONGODB_URI.includes('your_jwt_secret_here')) {
            console.log('⚠️  WARNING: MongoDB URI contains placeholder values');
            console.log('📝 Please update your .env file with real MongoDB Atlas credentials');
            console.log('🔗 Get your connection string from: https://cloud.mongodb.com/');
            console.log('');
            console.log('❌ Skipping database connection until credentials are provided');
            return;
        }
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas successfully');
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        console.log('💡 Make sure your MongoDB Atlas credentials are correct in the .env file');
        console.log('🔗 Check your connection string at: https://cloud.mongodb.com/');
        // Don't exit in development, allow server to run without DB for testing
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};
// Start server
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🎯 Environment: ${process.env.NODE_ENV}`);
    });
};
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await mongoose_1.default.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
});
startServer().catch(console.error);
exports.default = app;
