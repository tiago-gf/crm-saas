import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.js";
import { initializeDatabase, closeDatabase } from "./db.js";
import { startWhatsApp, stopWhatsApp } from "./whatsapp.js";

// Routes
import authRoutes from "./auth-routes.js";
import apiRoutes from "./api.js";
import adminRoutes from "./admin-routes.js";
import viewsRoutes from "./views-routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

// Session
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Admin-Token"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
  next();
});

// Routes

app.use("/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/admin/api", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render("404", { path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ===== STARTUP =====

const server = app.listen(config.port, "0.0.0.0", async () => {
  console.log(`\n🚀 Server running on ${config.baseUrl}`);
  console.log(`📁 Environment: ${config.nodeEnv}`);
  console.log(`💾 Database: ${config.dbType}`);

  try {
    // Initialize database
    await initializeDatabase();

    // Start WhatsApp
    if (config.whatsappEnabled) {
      startWhatsApp();
    }

    console.log("\n✅ WhatsApp AI CRM is ready!\n");
    console.log("📍 CRM:        http://localhost:3000/login");
    console.log("📍 Admin:      http://localhost:3000/admin/login");
    console.log("📍 API Health: http://localhost:3000/api/health\n");
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
});

// ===== GRACEFUL SHUTDOWN =====

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");

  try {
    await stopWhatsApp();
    await closeDatabase();
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
});

export default app;
