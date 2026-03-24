const mongoose = require("mongoose");

const db = async () => {
    try {
        // Try to connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB connected successfully");
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });
        
    } catch (e) {
        console.error("❌ Database connection error:", e.message);
        console.log("⚠️ Starting server without database connection for testing...");
        // Don't throw error - allow server to start for API testing
    }
};

module.exports = db;
