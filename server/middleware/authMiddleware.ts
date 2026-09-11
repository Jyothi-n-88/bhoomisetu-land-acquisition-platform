import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Extend Express Request interface to include user
export interface AuthRequest extends Request {
  user?: any;
}

// Protect routes
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
        return res.status(401).type('application/json').json({
          message: 'Unauthorized',
          success: false,
          detail: 'Authentication token is empty or invalid',
        });
      }

      // Verify token
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Retrieve user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).type('application/json').json({
          message: 'Unauthorized',
          success: false,
          detail: 'User associated with token not found',
        });
      }

      return next();
    } catch (error) {
      return res.status(401).type('application/json').json({
        message: 'Unauthorized',
        success: false,
        detail: 'Invalid or expired authentication token',
      });
    }
  }

  if (!token) {
    return res.status(401).type('application/json').json({
      message: 'Unauthorized',
      success: false,
      detail: 'Authorization token header missing',
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).type('application/json').json({
        message: 'Unauthorized',
        success: false,
        detail: req.user
          ? `User role '${req.user.role}' is not authorized to access this route`
          : 'Insufficient role permissions',
      });
    }
    return next();
  };
};
