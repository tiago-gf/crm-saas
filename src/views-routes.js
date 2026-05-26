import express from "express";
import { getDb } from "./db.js";

const router = express.Router();

// ===== CRM PAGES =====

// Dashboard
router.get("/", (req, res) => {
  if (req.session?.user) {
    return res.redirect("/crm/dashboard");
  }
  res.redirect("/login");
});

// Login page
router.get("/login", (req, res) => {
  if (req.session?.user) {
    return res.redirect("/crm/dashboard");
  }
  res.render("login");
});

// Register page
router.get("/register", (req, res) => {
  if (req.session?.user) {
    return res.redirect("/crm/dashboard");
  }
  res.render("register");
});

// CRM Dashboard
router.get("/crm/dashboard", (req, res) => {
  if (!req.session?.user) {
    return res.redirect("/login");
  }

  res.render("crm/dashboard", { user: req.session.user });
});

// Contacts page
router.get("/crm/contacts", (req, res) => {
  if (!req.session?.user) {
    return res.redirect("/login");
  }

  res.render("crm/contacts", { user: req.session.user });
});

// Contact detail
router.get("/crm/contacts/:id", (req, res) => {
  if (!req.session?.user) {
    return res.redirect("/login");
  }

  res.render("crm/contact-detail", { user: req.session.user, contactId: req.params.id });
});

// Rules page
router.get("/crm/rules", (req, res) => {
  if (!req.session?.user) {
    return res.redirect("/login");
  }

  res.render("crm/rules", { user: req.session.user });
});

// ===== ADMIN PAGES =====

// Admin login
router.get("/admin/login", (req, res) => {
  if (req.session?.adminToken) {
    return res.redirect("/admin/dashboard");
  }
  res.render("admin/login");
});

// Admin dashboard
router.get("/admin/dashboard", (req, res) => {
  if (!req.session?.adminToken) {
    return res.redirect("/admin/login");
  }

  res.render("admin/dashboard");
});

// Admin tenants page
router.get("/admin/tenants", (req, res) => {
  if (!req.session?.adminToken) {
    return res.redirect("/admin/login");
  }

  res.render("admin/tenants");
});

// ===== API TEST =====

// API Status
router.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

export default router;
