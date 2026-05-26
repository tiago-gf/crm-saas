import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import QRCode from "qrcode";
import { processMessage } from "./router.js";
import { getDb } from "./db.js";
import config from "./config.js";
import { v4 as uuidv4 } from "uuid";

let whatsappClient = null;
let clientReady = false;
let latestQR = null;

// ===== START WHATSAPP =====
export function startWhatsApp() {
  if (!config.whatsappEnabled) {
    console.log("⚠️ WhatsApp desativado");
    return;
  }

  if (whatsappClient) {
    return whatsappClient;
  }

  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: config.whatsappSessionPath || "./sessions",
    }),
    puppeteer: {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      timeout: config.whatsappTimeout || 60000,
    },
  });

  // ===== QR CODE =====
  whatsappClient.on("qr", async (qr) => {
    console.log("\n📱 WhatsApp QR Code (terminal):");
    qrcode.generate(qr, { small: true });

    try {
      latestQR = await QRCode.toDataURL(qr);
    } catch {
      latestQR = null;
    }
  });

  // ===== READY =====
  whatsappClient.on("ready", () => {
    clientReady = true;
    console.log("✅ WhatsApp conectado com sucesso");
  });

  // ===== MESSAGE HANDLER =====
  whatsappClient.on("message", async (msg) => {
    try {
      console.log(`📨 Mensagem recebida: ${msg.body}`);

      const tenantId = await getDefaultTenantId();

      if (!tenantId) {
        console.log("⚠️ Nenhum tenant ativo");
        return;
      }

      const result = await processMessage(msg, tenantId);

      await msg.reply(result.reply);
      console.log("✅ Resposta enviada");
    } catch (err) {
      console.error("❌ Erro ao processar mensagem:", err.message);
    }
  });

  // ===== DISCONNECT =====
  whatsappClient.on("disconnected", () => {
    clientReady = false;
    console.log("❌ WhatsApp desconectado");
  });

  // ===== ERROR =====
  whatsappClient.on("error", (err) => {
    console.error("⚠️ Erro no WhatsApp:", err.message);
  });

  // ===== INIT =====
  console.log("🚀 Inicializando WhatsApp...");
  whatsappClient.initialize();

  return whatsappClient;
}

// ===== GET QR (API) =====
export function getWhatsAppQR() {
  return latestQR;
}

// ===== STATUS =====
export function isWhatsAppReady() {
  return clientReady;
}

// ===== GET CLIENT =====
export function getWhatsAppClient() {
  return whatsappClient;
}

// ===== SEND MESSAGE =====
export async function sendWhatsAppMessage(phoneNumber, message) {
  if (!clientReady) {
    throw new Error("WhatsApp não conectado");
  }

  const chatId = `${phoneNumber}@c.us`;
  await whatsappClient.sendMessage(chatId, message);

  return { success: true };
}

// ===== STOP =====
export async function stopWhatsApp() {
  if (whatsappClient) {
    await whatsappClient.destroy();
    whatsappClient = null;
    clientReady = false;
    console.log("🛑 WhatsApp parado");
  }
}

// ===== TENANT (MVP) =====
async function getDefaultTenantId() {
  const db = await getDb();

  const tenant = await db.get(
    `SELECT id FROM tenants WHERE status = 'active' LIMIT 1`
  );

  return tenant?.id;
}

// ===== UPDATE SESSION =====
export async function updateWhatsAppSession(
  tenantId,
  phoneNumber,
  status
) {
  const db = await getDb();

  const existing = await db.get(
    `SELECT id FROM whatsapp_sessions WHERE tenant_id = ?`,
    [tenantId]
  );

  if (existing) {
    await db.run(
      `UPDATE whatsapp_sessions 
       SET phone_number = ?, status = ?, last_connected = CURRENT_TIMESTAMP 
       WHERE tenant_id = ?`,
      [phoneNumber, status, tenantId]
    );
  } else {
    await db.run(
      `INSERT INTO whatsapp_sessions (id, tenant_id, phone_number, status) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), tenantId, phoneNumber, status]
    );
  }
}