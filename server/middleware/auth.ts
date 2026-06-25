import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export default (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies?.token as string | undefined;
    if (!token) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET!) as Express.User;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
