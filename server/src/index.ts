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
import { staffRoutes } from "./routes/staff";
import { settingsRoutes } from "./routes/settings";
import { setupSocketEvents } from "./events/socketEvents";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const corsOrigin = process.env.CLIENT_URL || "http://localhost:3000";
const io = new Server(httpServer, {
  cors: { origin: corsOrigin, methods: ["GET", "POST"], credentials: true },
  transports: ["websocket", "polling"],
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests" },
});
app.use("/api/", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
  },
});
app.use("/api/auth", authLimiter);

app.use((req: any, res, next) => {
  req.io = io;
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/qr", qrRoutes);
app.use("/api/branches", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/waiter-requests", waiterRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/settings", settingsRoutes);

setupSocketEvents(io);

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

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time connections`);
  console.log(`🌐 CORS origin: ${corsOrigin}`);
});

export { io };
