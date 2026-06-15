const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        await mongoose.connect(mongoURI);
        console.log(`[DB] MongoDB connecté: ${mongoose.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('[DB] Erreur MongoDB:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('[DB] MongoDB déconnecté');
        });
    } catch (error) {
        console.error('[DB] Échec de connexion à MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
