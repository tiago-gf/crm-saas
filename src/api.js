import express from "express";
import { getDb } from "./db.js";
import { v4 as uuidv4 } from "uuid";
import { verifyJwtMiddleware, tenantMiddleware } from "./auth.js";
import { sendWhatsAppMessage } from "./whatsapp.js";

const router = express.Router();

// ===== CONTACTS =====

// List contacts
router.get("/contacts", verifyJwtMiddleware, tenantMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const contacts = await db.all(
      `SELECT * FROM contacts WHERE tenant_id = ? ORDER BY created_at DESC`,
      [req.tenantId]
    );

    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get contact
router.get(
  "/contacts/:id",
  verifyJwtMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const db = await getDb();
      const contact = await db.get(
        `SELECT * FROM contacts WHERE id = ? AND tenant_id = ?`,
        [req.params.id, req.tenantId]
      );

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json(contact);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Create contact
router.post("/contacts", verifyJwtMiddleware, tenantMiddleware, async (req, res) => {
  try {
    const { phone, name, email, tags } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }

    const db = await getDb();
    const id = uuidv4();

    await db.run(
      `INSERT INTO contacts (id, tenant_id, phone, name, email, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.tenantId, phone, name || "", email || "", tags || "", "active"]
    );

    res.status(201).json({ id, phone, name, email });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "Contact already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update contact
router.put(
  "/contacts/:id",
  verifyJwtMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const { name, email, tags, status } = req.body;
      const db = await getDb();

      const contact = await db.get(
        `SELECT * FROM contacts WHERE id = ? AND tenant_id = ?`,
        [req.params.id, req.tenantId]
      );

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      await db.run(
        `UPDATE contacts SET name = ?, email = ?, tags = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name || contact.name, email || contact.email, tags || contact.tags, status || contact.status, req.params.id]
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ===== MESSAGES =====

// List messages for contact
router.get(
  "/contacts/:contactId/messages",
  verifyJwtMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const db = await getDb();

      // Verify contact belongs to tenant
      const contact = await db.get(
        `SELECT * FROM contacts WHERE id = ? AND tenant_id = ?`,
        [req.params.contactId, req.tenantId]
      );

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      const messages = await db.all(
        `SELECT * FROM messages WHERE contact_id = ? ORDER BY created_at DESC LIMIT 50`,
        [req.params.contactId]
      );

      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Send message
router.post(
  "/contacts/:contactId/send",
  verifyJwtMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const db = await getDb();

      // Verify contact belongs to tenant
      const contact = await db.get(
        `SELECT * FROM contacts WHERE id = ? AND tenant_id = ?`,
        [req.params.contactId, req.tenantId]
      );

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      // Save message
      const messageId = uuidv4();
      await db.run(
        `INSERT INTO messages (id, tenant_id, contact_id, direction, body, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [messageId, req.tenantId, req.params.contactId, "outgoing", message, "sending"]
      );

      // Send via WhatsApp
      try {
        await sendWhatsAppMessage(contact.phone, message);
        await db.run(`UPDATE messages SET status = 'sent' WHERE id = ?`, [
          messageId,
        ]);
      } catch (err) {
        await db.run(`UPDATE messages SET status = 'failed' WHERE id = ?`, [
          messageId,
        ]);
        throw err;
      }

      res.json({ success: true, messageId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ===== RULES =====

// List rules
router.get("/rules", verifyJwtMiddleware, tenantMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const rules = await db.all(
      `SELECT * FROM rules WHERE tenant_id = ? ORDER BY created_at DESC`,
      [req.tenantId]
    );

    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create rule
router.post("/rules", verifyJwtMiddleware, tenantMiddleware, async (req, res) => {
  try {
    const { trigger, response } = req.body;

    if (!trigger || !response) {
      return res
        .status(400)
        .json({ error: "Trigger and response are required" });
    }

    const db = await getDb();
    const id = uuidv4();

    await db.run(
      `INSERT INTO rules (id, tenant_id, trigger, response, enabled) VALUES (?, ?, ?, ?, ?)`,
      [id, req.tenantId, trigger, response, 1]
    );

    res.status(201).json({ id, trigger, response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete rule
router.delete(
  "/rules/:id",
  verifyJwtMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const db = await getDb();

      await db.run(
        `DELETE FROM rules WHERE id = ? AND tenant_id = ?`,
        [req.params.id, req.tenantId]
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
