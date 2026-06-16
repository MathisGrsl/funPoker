const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        await mongoose.connect(mongoURI);
        console.log(`[DB] MongoDB connected: ${mongoose.connection.host}`);

        // Drop the googleId index if it was created without sparse (legacy).
        // Mongoose will recreate it correctly as a sparse unique index.
        const User = require('../models/User');
        await User.collection.dropIndex('googleId_1').catch(() => {});
        await User.syncIndexes();

        mongoose.connection.on('error', (err) => {
            console.error('[DB] MongoDB error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('[DB] MongoDB disconnected');
        });
    } catch (error) {
        console.error('[DB] Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
