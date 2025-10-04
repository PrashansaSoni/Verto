import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const getJWTSecret = (): string => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return JWT_SECRET;
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: { id: number; email: string; role: string }): string => {
  return jwt.sign(payload, getJWTSecret(), { expiresIn: JWT_EXPIRES_IN as any });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, getJWTSecret());
};
