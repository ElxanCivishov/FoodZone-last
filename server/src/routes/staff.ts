import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { staffCreateSchema } from '../lib/validation';

const router = Router();

router.get('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize(['admin']), validate(staffCreateSchema), async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });
    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role },
    });
    res.status(201).json({ success: true, data: { id: user.id, name, email, role } });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { name, email, role, status } = req.body;
    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (status !== undefined) data.status = status;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
});

export { router as staffRoutes };
