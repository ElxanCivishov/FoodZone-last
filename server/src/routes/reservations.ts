import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Rezervasiyalar siyahısı
router.get('/', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { branchId, date, status } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const where: any = { branchId };
    if (status) where.status = status;

    if (date) {
      const d = new Date(date as string);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.dateTime = { gte: d, lt: next };
    }

    const reservations = await prisma.tableReservation.findMany({
      where,
      include: {
        table: { select: { id: true, number: true, capacity: true, section: true } },
      },
      orderBy: { dateTime: 'asc' },
    });

    res.json({ success: true, data: reservations });
  } catch (err) { next(err); }
});

// Yeni rezervasiya
router.post('/', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { branchId, tableId, customerName, phone, partySize, dateTime, duration, notes } = req.body;

    if (!branchId || !customerName || !phone || !partySize || !dateTime) {
      return res.status(400).json({ success: false, message: 'Tələb olunan sahələri doldurun' });
    }

    const reservationTime = new Date(dateTime);
    const endTime = new Date(reservationTime.getTime() + (duration ?? 90) * 60000);

    // Masa mövcuddursa, həmin vaxt üçün çakışma yoxla
    if (tableId) {
      const conflict = await prisma.tableReservation.findFirst({
        where: {
          tableId,
          status: { in: ['confirmed', 'seated'] },
          AND: [
            { dateTime: { lt: endTime } },
            { dateTime: { gte: new Date(reservationTime.getTime() - (duration ?? 90) * 60000) } },
          ],
        },
      });
      if (conflict) {
        return res.status(400).json({ success: false, message: 'Bu masa həmin vaxt üçün artıq rezerv edilib' });
      }
    }

    const reservation = await prisma.tableReservation.create({
      data: {
        branchId,
        tableId: tableId || null,
        customerName,
        phone,
        partySize: Number(partySize),
        dateTime: reservationTime,
        duration: duration ?? 90,
        notes,
        status: 'confirmed',
      },
      include: {
        table: { select: { id: true, number: true, capacity: true, section: true } },
      },
    });

    // Bildiriş yarat
    await prisma.notification.create({
      data: {
        branchId,
        type: 'reservation',
        title: 'Yeni rezervasiya',
        message: `${customerName} — ${partySize} nəfər — ${reservationTime.toLocaleString('az-AZ')}`,
        data: { reservationId: reservation.id },
      },
    }).catch(() => {});

    res.status(201).json({ success: true, data: reservation });
  } catch (err) { next(err); }
});

// Rezervasiya statusunu yenilə
router.patch('/:id', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { status, tableId, notes } = req.body;
    const data: any = {};
    if (status !== undefined) data.status = status;
    if (tableId !== undefined) data.tableId = tableId;
    if (notes !== undefined) data.notes = notes;

    const reservation = await prisma.tableReservation.update({
      where: { id: req.params.id },
      data,
      include: {
        table: { select: { id: true, number: true } },
      },
    });
    res.json({ success: true, data: reservation });
  } catch (err) { next(err); }
});

// Rezervasiya sil
router.delete('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    await prisma.tableReservation.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Rezervasiya silindi' });
  } catch (err) { next(err); }
});

// Bugünkü rezervasiyalar (sadə endpoint)
router.get('/today', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reservations = await prisma.tableReservation.findMany({
      where: {
        branchId: branchId as string,
        dateTime: { gte: today, lt: tomorrow },
        status: { in: ['confirmed', 'seated'] },
      },
      include: {
        table: { select: { id: true, number: true, section: true } },
      },
      orderBy: { dateTime: 'asc' },
    });

    res.json({ success: true, data: reservations });
  } catch (err) { next(err); }
});

export { router as reservationRoutes };
