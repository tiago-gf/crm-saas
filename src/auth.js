import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import config from "./config.js";
import { getDb } from "./db.js";

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateToken(data, expiresIn = config.jwtExpiry) {
  return jwt.sign(data, config.jwtSecret, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return null;
  }
}

// Middleware para verificar JWT
export function verifyJwtMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = decoded;
  req.tenantId = decoded.tenantId;
  next();
}

// Middleware para isolamento de tenant
export function tenantMiddleware(req, res, next) {
  // Se é JWT, tenantId já foi setado acima
  // Se é session, pegar do session
  if (req.session?.user) {
    req.tenantId = req.session.user.tenantId;
  }

  if (!req.tenantId) {
    return res.status(401).json({ error: "Tenant not identified" });
  }

  // Adicionar tenantId automáticamente aos queries
  next();
}

// Criar tenant
export async function createTenant(name, email, password) {
  const db = await getDb();
  const id = uuidv4();
  const hashedPassword = await hashPassword(password);

  try {
    await db.run(
      `INSERT INTO tenants (id, name, email, password) VALUES (?, ?, ?, ?)`,
      [id, name, email, hashedPassword]
    );
    return { id, name, email };
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      throw new Error("Email or name already exists");
    }
    throw err;
  }
}

// Autenticar tenant
export async function authenticateTenant(email, password) {
  const db = await getDb();
  const tenant = await db.get(`SELECT * FROM tenants WHERE email = ?`, [email]);

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const valid = await comparePassword(password, tenant.password);
  if (!valid) {
    throw new Error("Invalid password");
  }

  return tenant;
}

// Buscar tenant por ID
export async function getTenantById(id) {
  const db = await getDb();
  return db.get(`SELECT * FROM tenants WHERE id = ?`, [id]);
}

// Admin auth (simples para MVP)
export function adminAuth(req, res, next) {
  const adminToken = req.session?.adminToken;

  if (
    !adminToken ||
    adminToken !== config.adminSecret
  ) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  next();
}

// Verificar admin via header
export function adminTokenHeader(req, res, next) {
  const token = req.headers["x-admin-token"];

  if (token !== config.adminSecret) {
    return res.status(403).json({ error: "Invalid admin token" });
  }

  next();
}
