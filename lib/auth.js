import jwt from 'jsonwebtoken';
import User from '@/models/User';
import dbConnect from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

export const requireAuth = async (request) => {
  try {
    await dbConnect();
    
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const checkPermission = (user, requiredPermissions = []) => {
  if (user.role === 'superadmin') return true;
  
  if (requiredPermissions.length === 0) return true;
  
  return requiredPermissions.some(permission => 
    user.permissions?.includes(permission)
  );
};