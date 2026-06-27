import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

const CUSTOMER_SELECT = {
  id: true, name: true, phone: true,
  totalOrders: true, totalSpent: true, points: true, tags: true,
} as const;

const TABLE_SELECT = {
  id: true, number: true, capacity: true, section: true,
} as const;

function overlapConflict(
  candidates: Array<{ id: string; dateTime: Date | string; duration: number | null }>,
  newStart: Date,
  newDur: number,
  excludeId?: string,
) {
  const ns = newStart.getTime();
  const ne = ns + newDur * 60000;
  return candidates.find(c => {
    if (excludeId && c.id === excludeId) return false;
    const cs = new Date(c.dateTime).getTime();
    const ce = cs + (c.duration ?? 90) * 60000;
    return ns < ce && ne > cs;
  });
}

// ─── List ─────────────────────────────────────────────────────────────────────
router.get('/', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { branchId, date, from, to, status } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const where: any = { branchId };
    if (status) where.status = status;
    if (date) {
      const d = new Date(date as string);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.dateTime = { gte: d, lt: next };
    } else if (from || to) {
      where.dateTime = {};
      if (from) where.dateTime.gte = new Date(from as string);
      if (to)   { const t = new Date(to as string); t.setDate(t.getDate() + 1); where.dateTime.lt = t; }
    }

    const reservations = await prisma.tableReservation.findMany({
      where,
      include: {
        table:    { select: TABLE_SELECT },
        customer: { select: CUSTOMER_SELECT },
      },
      orderBy: { dateTime: 'asc' },
    });
    res.json({ success: true, data: reservations });
  } catch (err) { next(err); }
});

// ─── Create ───────────────────────────────────────────────────────────────────
router.post('/', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const {
      branchId, tableId, customerId,
      customerName, phone, partySize, dateTime, duration, notes,
      walkIn,   // boolean flag for quick walk-in (status defaults to 'seated')
    } = req.body;

    if (!branchId || !customerName || !partySize || !dateTime) {
      return res.status(400).json({ success: false, message: 'branchId, customerName, partySize, dateTime tələb olunur' });
    }

    const resTime = new Date(dateTime);
    const dur     = Number(duration ?? 90);
    const status  = walkIn ? 'seated' : 'confirmed';

    if (tableId) {
      const candidates = await prisma.tableReservation.findMany({
        where: { tableId, status: { in: ['confirmed', 'seated'] }, dateTime: { lt: new Date(resTime.getTime() + dur * 60000) } },
        select: { id: true, dateTime: true, duration: true },
      });
      if (overlapConflict(candidates, resTime, dur)) {
        return res.status(400).json({ success: false, message: 'Bu masa həmin vaxt intervalında artıq rezerv edilib' });
      }
    }

    const reservation = await prisma.tableReservation.create({
      data: {
        branchId,
        tableId:      tableId   || null,
        customerId:   customerId || null,
        customerName: customerName.trim(),
        phone:        (phone ?? '').trim(),
        partySize:    Number(partySize),
        dateTime:     resTime,
        duration:     dur,
        notes:        notes?.trim() || null,
        status,
      },
      include: {
        table:    { select: TABLE_SELECT },
        customer: { select: CUSTOMER_SELECT },
      },
    });

    await prisma.notification.create({
      data: {
        branchId,
        type:    'reservation',
        title:   walkIn ? 'Walk-in qeydiyyat' : 'Yeni rezervasiya',
        message: `${customerName} — ${partySize} nəfər — ${resTime.toLocaleString('az-AZ')}`,
        data:    { reservationId: reservation.id },
      },
    }).catch(() => {});

    res.status(201).json({ success: true, data: reservation });
  } catch (err) { next(err); }
});

// ─── Update (tam redaktə) ─────────────────────────────────────────────────────
router.patch('/:id', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const {
      status, tableId, notes, customerId,
      customerName, phone, partySize, dateTime, duration,
    } = req.body;

    const data: any = {};
    if (status       !== undefined) data.status       = status;
    if (tableId      !== undefined) data.tableId      = tableId ?? null;
    if (customerId   !== undefined) data.customerId   = customerId ?? null;
    if (notes        !== undefined) data.notes        = notes;
    if (customerName !== undefined) data.customerName = customerName;
    if (phone        !== undefined) data.phone        = phone;
    if (partySize    !== undefined) data.partySize    = Number(partySize);
    if (dateTime     !== undefined) data.dateTime     = new Date(dateTime);
    if (duration     !== undefined) data.duration     = Number(duration);

    if ((tableId || dateTime || duration) && data.tableId) {
      const current = await prisma.tableReservation.findUnique({ where: { id: req.params.id } });
      if (current) {
        const resTime = data.dateTime ?? current.dateTime;
        const dur     = data.duration ?? current.duration ?? 90;
        const candidates = await prisma.tableReservation.findMany({
          where: { tableId: data.tableId, status: { in: ['confirmed', 'seated'] }, dateTime: { lt: new Date(new Date(resTime).getTime() + dur * 60000) } },
          select: { id: true, dateTime: true, duration: true },
        });
        if (overlapConflict(candidates, new Date(resTime), dur, req.params.id)) {
          return res.status(400).json({ success: false, message: 'Bu masa həmin vaxt intervalında artıq rezerv edilib' });
        }
      }
    }

    const reservation = await prisma.tableReservation.update({
      where: { id: req.params.id },
      data,
      include: {
        table:    { select: TABLE_SELECT },
        customer: { select: CUSTOMER_SELECT },
      },
    });
    res.json({ success: true, data: reservation });
  } catch (err) { next(err); }
});

// ─── Delete ───────────────────────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    await prisma.tableReservation.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Rezervasiya silindi' });
  } catch (err) { next(err); }
});

// ─── Today shortcut ───────────────────────────────────────────────────────────
router.get('/today', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const reservations = await prisma.tableReservation.findMany({
      where: { branchId: branchId as string, dateTime: { gte: today, lt: tomorrow }, status: { in: ['confirmed', 'seated'] } },
      include: { table: { select: TABLE_SELECT }, customer: { select: CUSTOMER_SELECT } },
      orderBy: { dateTime: 'asc' },
    });
    res.json({ success: true, data: reservations });
  } catch (err) { next(err); }
});

export { router as reservationRoutes };
