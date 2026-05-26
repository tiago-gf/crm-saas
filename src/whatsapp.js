import { Client } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { processMessage } from "./router.js";
import { getDb } from "./db.js";
import config from "./config.js";
import path from "path";
import { v4 as uuidv4 } from "uuid";

let whatsappClient = null;
let clientReady = false;

// Inicializar WhatsApp (estrutura obrigatória do usuário)
export function startWhatsApp() {
  if (!config.whatsappEnabled) {
    console.log("⚠️  WhatsApp is disabled");
    return;
  }

  if (whatsappClient) {
    return whatsappClient;
  }

  const sessionPath = path.join(config.whatsappSessionPath, "session.json");

  whatsappClient = new Client({
    puppeteer: {
      args: ["--no-sandbox"],
      timeout: config.whatsappTimeout,
    },
    session: {
      path: sessionPath,
    },
  });

  // QR Code display
  whatsappClient.on("qr", (qr) => {
    console.log("\n📱 WhatsApp QR Code gerado. Escaneie com seu WhatsApp:");
    qrcode.generate(qr, { small: true });
  });

  // Connection ready
  whatsappClient.on("ready", () => {
    clientReady = true;
    console.log("✅ WhatsApp conectado com sucesso");
  });

  // Message handler (estrutura obrigatória)
  whatsappClient.on("message", async (msg) => {
    try {
      console.log(`📨 Mensagem recebida: ${msg.body}`);

      // Para MVP, processar com tenant ID padrão
      // Em produção, você teria múltiplas instâncias ou um mapeamento
      const defaultTenantId = await getDefaultTenantId();

      if (!defaultTenantId) {
        console.log("⚠️  Nenhum tenant configurado");
        return;
      }

      const result = await processMessage(msg, defaultTenantId);

      // Responder (estrutura obrigatória)
      msg.reply(result.reply);
      console.log("✅ Resposta enviada");
    } catch (err) {
      console.error("❌ Erro ao processar mensagem:", err);
      msg.reply("❌ Erro ao processar mensagem");
    }
  });

  // Disconnect handler
  whatsappClient.on("disconnected", () => {
    clientReady = false;
    console.log("❌ WhatsApp desconectado");
  });

  // Error handler
  whatsappClient.on("error", (err) => {
    console.error("⚠️  Erro no WhatsApp:", err.message);
  });

  // Initialize
  console.log("🚀 Inicializando WhatsApp...");
  try {
    whatsappClient.initialize();
  } catch (err) {
    console.error("⚠️  Não foi possível inicializar WhatsApp:", err.message);
    console.log("   Dica: Certifique-se de que tem dependências do navegador instaladas");
  }

  return whatsappClient;
}

// Obter tenant padrão (para MVP com single WhatsApp instance)
async function getDefaultTenantId() {
  const db = await getDb();
  const tenant = await db.get(
    `SELECT id FROM tenants WHERE status = 'active' LIMIT 1`
  );
  return tenant?.id;
}

// Parar WhatsApp
export async function stopWhatsApp() {
  if (whatsappClient) {
    await whatsappClient.destroy();
    whatsappClient = null;
    clientReady = false;
    console.log("🛑 WhatsApp parado");
  }
}

// Obter cliente WhatsApp
export function getWhatsAppClient() {
  return whatsappClient;
}

// Verificar status
export function isWhatsAppReady() {
  return clientReady;
}

// Enviar mensagem para contato
export async function sendWhatsAppMessage(phoneNumber, message) {
  if (!clientReady) {
    throw new Error("WhatsApp not connected");
  }

  try {
    const chatId = `${phoneNumber}@c.us`;
    await whatsappClient.sendMessage(chatId, message);
    return { success: true, message: "Message sent" };
  } catch (err) {
    console.error("Error sending message:", err);
    throw err;
  }
}

// Atualizar status da sessão WhatsApp no DB
export async function updateWhatsAppSession(tenantId, phoneNumber, status) {
  const db = await getDb();

  const existing = await db.get(
    `SELECT id FROM whatsapp_sessions WHERE tenant_id = ?`,
    [tenantId]
  );

  if (existing) {
    await db.run(
      `UPDATE whatsapp_sessions SET phone_number = ?, status = ?, last_connected = CURRENT_TIMESTAMP 
       WHERE tenant_id = ?`,
      [phoneNumber, status, tenantId]
    );
  } else {
    await db.run(
      `INSERT INTO whatsapp_sessions (id, tenant_id, phone_number, status) VALUES (?, ?, ?, ?)`,
      [uuidv4(), tenantId, phoneNumber, status]
    );
  }
}
