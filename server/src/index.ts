import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import path from "path";

import { qrRoutes } from "./routes/qr";
import { menuRoutes } from "./routes/menu";
import { orderRoutes } from "./routes/orders";
import { waiterRoutes } from "./routes/waiter";
import { authRoutes } from "./routes/auth";
import { dashboardRoutes } from "./routes/dashboard";
import { uploadRoutes } from "./routes/upload";
import { setupSocketEvents } from "./events/socketEvents";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const corsOrigin = process.env.CLIENT_URL || "http://localhost:3000";
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});
app.use("/api/", limiter);

// Stricter limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts" },
});
app.use("/api/auth/login", authLimiter);

// Attach io to requests
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// server/src/index.ts - route-lardan SONRA əlavə et
console.log("📡 Registered routes:");
console.log("  /api/dashboard");

// Routes
app.use("/api/qr", qrRoutes);
app.use("/api/branches", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/waiter-requests", waiterRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/upload", uploadRoutes);

app.use("/api/dashboard", (req, res, next) => {
  console.log("DASHBOARD PREFIX HIT");
  next();
});

app.use("/api/dashboard", dashboardRoutes);
// Socket.io Events
setupSocketEvents(io);

// Health check with DB verification
app.get("/health", async (req, res) => {
  try {
    const { prisma } = await import("./lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time connections`);
  console.log(`🌐 CORS origin: ${corsOrigin}`);
});

export { io };
