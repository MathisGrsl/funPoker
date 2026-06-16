const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String },
        googleId: { type: String, sparse: true, unique: true },
        avatar: { type: String },
    },
    { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);
