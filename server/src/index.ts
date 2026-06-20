import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { qrRoutes } from './routes/qr';
import { menuRoutes } from './routes/menu';
import { orderRoutes } from './routes/orders';
import { waiterRoutes } from './routes/waiter';
import { authRoutes } from './routes/auth';
import { setupSocketEvents } from './events/socketEvents';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Attach io to requests
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/qr', qrRoutes);
app.use('/api/branches', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/waiter-requests', waiterRoutes);
app.use('/api/auth', authRoutes);

// Socket.io Events
setupSocketEvents(io);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time connections`);
});

export { io };
