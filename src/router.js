import { getDb } from "./db.js";
import { v4 as uuidv4 } from "uuid";

// Processar mensagem recebida do WhatsApp
export async function processMessage(msg, tenantId) {
  const messageBody = msg.body;
  const from = msg.from; // Número do sender
  const timestamp = msg.timestamp;

  // Encontrar ou criar contato
  const db = await getDb();
  let contact = await db.get(
    `SELECT id FROM contacts WHERE tenant_id = ? AND phone = ?`,
    [tenantId, from]
  );

  if (!contact) {
    const contactId = uuidv4();
    await db.run(
      `INSERT INTO contacts (id, tenant_id, phone, name, status) VALUES (?, ?, ?, ?, ?)`,
      [contactId, tenantId, from, `Contact ${from}`, "active"]
    );
    contact = { id: contactId };
  }

  // Salvar mensagem recebida
  const messageId = uuidv4();
  await db.run(
    `INSERT INTO messages (id, tenant_id, contact_id, direction, body, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [messageId, tenantId, contact.id, "incoming", messageBody, "received"]
  );

  // Buscar regra de resposta automática
  const rule = await db.get(
    `SELECT response FROM rules WHERE tenant_id = ? AND trigger = ? AND enabled = 1 LIMIT 1`,
    [tenantId, messageBody]
  );

  let reply = "👋 Olá! Mensagem recebida. Logo mais retornaremos.";

  if (rule) {
    reply = rule.response;
  }

  // Salvar resposta
  const replyId = uuidv4();
  await db.run(
    `INSERT INTO messages (id, tenant_id, contact_id, direction, body, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [replyId, tenantId, contact.id, "outgoing", reply, "sent"]
  );

  return { reply, contactId: contact.id };
}

// Buscar próxima mensagem para processar
export async function getNextMessage(tenantId) {
  const db = await getDb();
  return db.get(
    `SELECT m.*, c.phone FROM messages m 
     JOIN contacts c ON m.contact_id = c.id
     WHERE m.tenant_id = ? AND m.status = 'received' 
     ORDER BY m.created_at LIMIT 1`,
    [tenantId]
  );
}

// Marcar mensagem como processada
export async function markMessageAsProcessed(messageId) {
  const db = await getDb();
  await db.run(`UPDATE messages SET status = 'processed' WHERE id = ?`, [
    messageId,
  ]);
}
