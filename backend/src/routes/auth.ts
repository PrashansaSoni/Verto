import { Router, Request, Response } from 'express';
import { User } from '../models';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { registerSchema, loginSchema, forgotPasswordSchema } from '../validators/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, phone, password, role } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password_hash,
      role
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req: Request, res: Response, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email address. Please check your email or sign up for a new account.' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Incorrect password. Please check your password and try again.' });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Forgot Password (placeholder - would need email service)
router.post('/forgot-password', async (req: Request, res: Response, next) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email } = value;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // TODO: Implement email service to send reset link
    // For now, just return success message
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
});

export default router;
