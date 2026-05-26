import { initializeDatabase, closeDatabase } from "../src/db.js";
import { createTenant } from "../src/auth.js";

async function init() {
  console.log("🔄 Inicializando banco de dados...");

  try {
    // Initialize database
    await initializeDatabase();

    // Create demo tenant
    const demoTenant = await createTenant(
      "Demo Company",
      "demo@example.com",
      "demo123"
    );

    console.log("✅ Demo tenant criado:");
    console.log(`   Email: demo@example.com`);
    console.log(`   Senha: demo123`);
    console.log(`   ID: ${demoTenant.id}`);

    await closeDatabase();
    console.log("\n✅ Banco de dados inicializado com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao inicializar banco de dados:", err);
    process.exit(1);
  }
}

init();
