import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [{ userId: null }, ...(userId ? [{ userId }] : [])],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        OR: [{ userId: null }, ...(userId ? [{ userId }] : [])],
        isRead: false,
      },
    });

    return res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === 'all') {
      const userId = req.user?.userId;
      await prisma.notification.updateMany({
        where: {
          OR: [{ userId: null }, ...(userId ? [{ userId }] : [])],
          isRead: false,
        },
        data: { isRead: true },
      });
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
