const router = require('express').Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const signToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

const setTokenCookie = (res, token, rememberMe) =>
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        ...(rememberMe ? { maxAge: 300 * 24 * 60 * 60 * 1000 } : {}),
    });

const userPayload = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password)
            return res.status(400).json({ error: 'All fields are required' });

        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists)
            return res.status(409).json({
                error: exists.email === email.toLowerCase()
                    ? 'Email already in use'
                    : 'Username already taken',
            });

        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({ username, email, password: hashed });

        const token = signToken(user._id);
        setTokenCookie(res, token, false);
        res.status(201).json({ user: userPayload(user) });
    } catch (err) {
        console.error('[AUTH] register:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.password)
            return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

        const token = signToken(user._id);
        setTokenCookie(res, token, !!rememberMe);
        res.json({ user: userPayload(user) });
    } catch (err) {
        console.error('[AUTH] login:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/google  → redirige vers Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /api/auth/google/callback  → Google redirige ici
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}?error=google_failed` }),
    (req, res) => {
        const token = signToken(req.user._id);
        setTokenCookie(res, token, true); // Google = toujours remembered
        res.redirect(process.env.CLIENT_URL || 'http://localhost:3000');
    },
);

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    res.json({ message: 'Logged out' });
});

// GET /api/auth/me  (protected)
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user: userPayload(user) });
    } catch (err) {
        console.error('[AUTH] me:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
