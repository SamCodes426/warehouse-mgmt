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
