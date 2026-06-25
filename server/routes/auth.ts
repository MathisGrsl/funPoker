import { Router, Request, Response } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import auth from '../middleware/auth';

const router = Router();

const signToken = (userId: string): string =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });

const setTokenCookie = (res: Response, token: string, rememberMe: boolean): void => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
    });
};

const userPayload = (user: any) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) {
            res.status(409).json({
                error: exists.email === email.toLowerCase()
                    ? 'Email already in use'
                    : 'Username already taken',
            });
            return;
        }

        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({ username, email, password: hashed });

        const token = signToken(user._id.toString());
        setTokenCookie(res, token, false);
        res.status(201).json({ user: userPayload(user) });
    } catch (err) {
        console.error('[AUTH] register:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password, rememberMe } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.password) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            res.status(401).json({ error: 'Identifiants invalides' });
            return;
        }

        const token = signToken(user._id.toString());
        setTokenCookie(res, token, !!rememberMe);
        res.json({ user: userPayload(user) });
    } catch (err) {
        console.error('[AUTH] login:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /api/auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}?error=google_failed` }),
    (req: Request, res: Response) => {
        const token = signToken((req.user as any)._id.toString());
        setTokenCookie(res, token, true);
        res.redirect(process.env.CLIENT_URL || 'http://localhost:3000');
    },
);

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    res.json({ message: 'Logged out' });
});

// GET /api/auth/me (protected)
router.get('/me', auth, async (req: Request, res: Response) => {
    try {
        const user = await User.findById((req.user as any).id).select('-password');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user: userPayload(user) });
    } catch (err) {
        console.error('[AUTH] me:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
