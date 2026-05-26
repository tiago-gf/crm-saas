import express from "express";
import {
  createTenant,
  authenticateTenant,
  generateToken,
  adminAuth,
} from "./auth.js";
import { getDb } from "./db.js";

const router = express.Router();

// ===== TENANT AUTH =====

// Register
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const tenant = await createTenant(name, email, password);
    const token = generateToken({
      tenantId: tenant.id,
      email: tenant.email,
      name: tenant.name,
    });

    res.status(201).json({
      success: true,
      tenant,
      token,
      message: "Tenant created successfully",
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const tenant = await authenticateTenant(email, password);
    const token = generateToken({
      tenantId: tenant.id,
      email: tenant.email,
      name: tenant.name,
    });

    // Set session
    req.session.user = {
      tenantId: tenant.id,
      email: tenant.email,
      name: tenant.name,
    };

    res.json({
      success: true,
      tenant,
      token,
      message: "Login successful",
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Logout
router.post("/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: "Logged out" });
});

// Get current tenant
router.get("/auth/me", (req, res) => {
  if (!req.session?.user && !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = req.session?.user || req.user;
  res.json(user);
});

// ===== ADMIN AUTH =====

// Admin login
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar credenciais admin (por enquanto simples)
    // Em produção, isso seria mais elaborado
    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.adminToken = process.env.ADMIN_SECRET;

    res.json({
      success: true,
      message: "Admin login successful",
      token: process.env.ADMIN_SECRET,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin logout
router.post("/admin/logout", (req, res) => {
  req.session.adminToken = null;
  res.json({ success: true, message: "Admin logged out" });
});

export default router;
