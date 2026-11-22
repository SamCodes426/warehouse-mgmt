import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../lib/jwt';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const authorize = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' lacks permission for this resource.`,
      });
    }

    next();
  };
};
