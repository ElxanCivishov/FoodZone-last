import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { LoginSchema, RegisterSchema } from '../lib/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: { 
        token, 
        user: { id: user.id, email: user.email, name: user.name, role: user.role } 
      }
    });
  } catch (err) { next(err); }
});

router.post('/register', validate(RegisterSchema), async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role },
    });

    res.status(201).json({ 
      success: true, 
      data: { id: user.id, email, name, role: user.role } 
    });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

export { router as authRoutes };
