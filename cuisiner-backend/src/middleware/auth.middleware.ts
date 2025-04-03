import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

// Define a type for our JWT payload
interface TokenPayload {
  id: string;
  [key: string]: any;
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user data to request
 */
export const auth = (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if decoded is a string or an object
    if (typeof decoded === 'string') {
      throw new Error('Invalid token format');
    }
    
    // Add user from payload
    req.user = {
      id: (decoded as TokenPayload).id
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth; 