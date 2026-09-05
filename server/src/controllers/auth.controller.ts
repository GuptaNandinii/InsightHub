import { Request, Response } from 'express';
import { User } from '../models/User';
import { signToken } from '../utils/token';
import { ApiError } from '../utils/apiError';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.badRequest('An account with this email already exists.');
  }

  const user = await User.create({ name, email, password });
  const token = signToken({ userId: user._id.toString(), email: user.email });

  res.status(201).json({
    success: true,
    message: 'Account registered successfully',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password credentials.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password credentials.');
  }

  const token = signToken({ userId: user._id.toString(), email: user.email });

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
};

export const demoLogin = async (_req: Request, res: Response): Promise<void> => {
  const demoEmail = 'demo@insighthub.com';
  let demoUser = await User.findOne({ email: demoEmail });

  if (!demoUser) {
    demoUser = await User.create({
      name: 'Demo Analyst',
      email: demoEmail,
      password: 'Password123!',
      role: 'user',
    });
  }

  const token = signToken({ userId: demoUser._id.toString(), email: demoUser.email });

  res.status(200).json({
    success: true,
    message: 'Authenticated with Demo Account',
    data: {
      token,
      user: {
        id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
      },
    },
  });
};
