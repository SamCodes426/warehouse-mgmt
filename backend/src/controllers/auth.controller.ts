import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { generateToken } from '../lib/jwt';
import { Role } from '@prisma/client';

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { warehouse: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouseId,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'USER',
        entityId: user.id,
        details: `User ${user.email} logged in successfully`,
        ipAddress: req.ip || null,
      },
    });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          warehouseId: user.warehouseId,
          warehouseName: user.warehouse?.name || null,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        warehouseId: true,
        warehouse: { select: { id: true, name: true, code: true } },
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        warehouse: { select: { id: true, name: true, code: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: users });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, role, phone, warehouseId } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
        phone,
        warehouseId: warehouseId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        warehouseId: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_USER',
        entity: 'USER',
        entityId: newUser.id,
        details: `Created new user ${newUser.email} with role ${newUser.role}`,
      },
    });

    return res.status(201).json({ success: true, message: 'User created successfully', data: newUser });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const register = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, phone, role = 'INVENTORY_STAFF' } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
        phone: phone || null,
      },
      include: { warehouse: true },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouseId,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entity: 'USER',
        entityId: user.id,
        details: `New user ${user.email} registered with role ${user.role}`,
        ipAddress: req.ip || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          warehouseId: user.warehouseId,
          warehouseName: user.warehouse?.name || null,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

export const forgotPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'No active user account found with this email address' });
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetCode,
        resetTokenExpiry: expiry,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FORGOT_PASSWORD_REQUEST',
        entity: 'USER',
        entityId: user.id,
        details: `Password reset code generated for ${user.email}`,
        ipAddress: req.ip || null,
      },
    });

    return res.json({
      success: true,
      message: 'Password reset verification code generated (valid for 15 minutes).',
      data: {
        resetCode,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to process request' });
  }
};

export const resetPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.resetToken || user.resetToken !== resetCode) {
      return res.status(400).json({ success: false, message: 'Invalid or incorrect reset code' });
    }

    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'RESET_PASSWORD_SUCCESS',
        entity: 'USER',
        entityId: user.id,
        details: `Password successfully reset for ${user.email}`,
        ipAddress: req.ip || null,
      },
    });

    return res.json({
      success: true,
      message: 'Password successfully updated! You can now sign in with your new password.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to reset password' });
  }
};
