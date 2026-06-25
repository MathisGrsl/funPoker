import mongoose from 'mongoose';
import User from '../models/User';

const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        await mongoose.connect(mongoURI);
        console.log(`[DB] MongoDB connected: ${mongoose.connection.host}`);

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

export default connectDB;
