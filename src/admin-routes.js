import express from "express";
import { adminAuth } from "./auth.js";
import { getDb } from "./db.js";

const router = express.Router();

// Middleware para admin
router.use(adminAuth);

// ===== TENANTS MANAGEMENT =====

// List all tenants
router.get("/tenants", async (req, res) => {
  try {
    const db = await getDb();
    const tenants = await db.all(`
      SELECT 
        t.id, t.name, t.email, t.plan, t.status, t.created_at,
        COUNT(DISTINCT c.id) as contact_count,
        COUNT(DISTINCT m.id) as message_count
      FROM tenants t
      LEFT JOIN contacts c ON t.id = c.tenant_id
      LEFT JOIN messages m ON t.id = m.tenant_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tenant details
router.get("/tenants/:id", async (req, res) => {
  try {
    const db = await getDb();
    const tenant = await db.get(
      `SELECT * FROM tenants WHERE id = ?`,
      [req.params.id]
    );

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const stats = await db.get(
      `
      SELECT 
        COUNT(DISTINCT c.id) as contact_count,
        COUNT(DISTINCT m.id) as message_count
      FROM contacts c
      LEFT JOIN messages m ON c.tenant_id = m.tenant_id
      WHERE c.tenant_id = ?
    `,
      [req.params.id]
    );

    res.json({ ...tenant, ...stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update tenant status
router.patch("/tenants/:id", async (req, res) => {
  try {
    const { status, plan } = req.body;
    const db = await getDb();

    const tenant = await db.get(
      `SELECT * FROM tenants WHERE id = ?`,
      [req.params.id]
    );

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    await db.run(
      `UPDATE tenants SET status = ?, plan = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status || tenant.status, plan || tenant.plan, req.params.id]
    );

    res.json({ success: true, message: "Tenant updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete tenant
router.delete("/tenants/:id", async (req, res) => {
  try {
    const db = await getDb();

    // Cascading delete is handled by foreign keys
    await db.run(`DELETE FROM tenants WHERE id = ?`, [req.params.id]);

    res.json({ success: true, message: "Tenant deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ANALYTICS =====

// Get platform stats
router.get("/stats", async (req, res) => {
  try {
    const db = await getDb();

    const stats = await db.get(`
      SELECT 
        COUNT(DISTINCT t.id) as total_tenants,
        COUNT(DISTINCT c.id) as total_contacts,
        COUNT(DISTINCT m.id) as total_messages,
        SUM(CASE WHEN t.status = 'active' THEN 1 ELSE 0 END) as active_tenants,
        SUM(CASE WHEN t.plan = 'premium' THEN 1 ELSE 0 END) as premium_tenants
      FROM tenants t
      LEFT JOIN contacts c ON t.id = c.tenant_id
      LEFT JOIN messages m ON t.id = m.tenant_id
    `);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get usage by tenant
router.get("/usage", async (req, res) => {
  try {
    const db = await getDb();

    const usage = await db.all(`
      SELECT 
        t.id, t.name, t.email, t.plan,
        COUNT(DISTINCT c.id) as contacts,
        COUNT(DISTINCT m.id) as messages,
        MAX(m.created_at) as last_activity
      FROM tenants t
      LEFT JOIN contacts c ON t.id = c.tenant_id
      LEFT JOIN messages m ON t.id = m.tenant_id
      GROUP BY t.id
      ORDER BY messages DESC
    `);

    res.json(usage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
