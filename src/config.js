import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  baseUrl: process.env.BASE_URL || "http://localhost:3000",

  // Database
  dbType: process.env.DB_TYPE || "sqlite",
  dbPath: process.env.DB_PATH || path.join(__dirname, "../../data/crm.db"),
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET || "dev_secret_key_not_for_production",
  jwtExpiry: process.env.JWT_EXPIRY || "7d",

  // Session
  sessionSecret:
    process.env.SESSION_SECRET || "dev_session_secret_not_for_production",

  // WhatsApp
  whatsappEnabled: process.env.WHATSAPP_ENABLED === "true",
  whatsappSessionPath:
    process.env.WHATSAPP_SESSION_PATH || path.join(__dirname, "../../data/whatsapp_session"),
  whatsappTimeout: parseInt(process.env.WHATSAPP_TIMEOUT || "60000"),

  // Admin
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  adminSecret: process.env.ADMIN_SECRET || "admin_secret",

  // Features
  enableAiResponses: process.env.ENABLE_AI_RESPONSES === "true",
  enableWebhooks: process.env.ENABLE_WEBHOOKS === "true",

  // Paths
  rootDir: path.join(__dirname, "../../"),
  srcDir: __dirname,
  dataDir: path.join(__dirname, "../../data"),
};
