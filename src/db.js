import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import config from "./config.js";

let db = null;

export async function getDb() {
  if (db) return db;

  const dbPath =
    config.dbType === "postgres" ? config.databaseUrl : config.dbPath;

  if (config.dbType === "sqlite") {
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    import("fs").then(async (fs) => {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    });

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Enable foreign keys
    await db.exec("PRAGMA foreign_keys = ON");
  }

  return db;
}

export async function initializeDatabase() {
  const db = await getDb();

  // Tenants table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      plan TEXT DEFAULT 'free',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Contacts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      phone TEXT NOT NULL,
      name TEXT,
      email TEXT,
      status TEXT DEFAULT 'active',
      tags TEXT,
      custom_fields TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      UNIQUE(tenant_id, phone)
    )
  `);

  // Messages table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      body TEXT,
      status TEXT DEFAULT 'sent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // Rules table (para respostas automáticas)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      trigger TEXT NOT NULL,
      response TEXT NOT NULL,
      enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    )
  `);

  // WhatsApp Sessions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_sessions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL UNIQUE,
      phone_number TEXT,
      status TEXT DEFAULT 'disconnected',
      last_connected DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id);
    CREATE INDEX IF NOT EXISTS idx_rules_tenant ON rules(tenant_id);
  `);

  console.log("✅ Database initialized successfully");
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
  }
}
