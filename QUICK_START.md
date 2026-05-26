# WhatsApp AI CRM - Quick Start Guide

## 🚀 Começar em 2 minutos

### 1. Clone e Instale

```bash
cd crm-saas
npm install
npm run db:init
```

### 2. Rodar Localmente

```bash
npm start        # Produção
# ou
npm run dev      # Desenvolvimento (com auto-reload)
```

### 3. Acessar

- **CRM**: http://localhost:3000/login
- **Admin**: http://localhost:3000/admin/login
- **Health**: http://localhost:3000/api/health

## 📝 Credenciais Padrão

### CRM
```
Email: demo@example.com
Senha: demo123
```

### Admin
```
Email: admin@example.com
Senha: admin123
```

## 🔑 Funcionalidades

### ✅ CRM (Cliente)
- [x] Dashboard com estatísticas
- [x] Gerenciar contatos (CRUD)
- [x] Histórico de mensagens
- [x] Respostas automáticas (regras)
- [x] Enviar mensagens
- [x] JWT Authentication

### ✅ Admin Panel
- [x] Dashboard de plataforma
- [x] Gerenciar tenants (CRUD)
- [x] Ver uso por tenant
- [x] Estatísticas globais

### ✅ Backend
- [x] Multi-tenancy
- [x] REST API completa
- [x] Session management
- [x] SQLite database
- [x] WhatsApp integration (estrutura pronta)

## 📱 WhatsApp Integration

A integração WhatsApp está pronta! Para ativar:

1. Editar `.env`:
```
WHATSAPP_ENABLED=true
```

2. Instalar dependências do Puppeteer:
```bash
# Ubuntu/Debian
sudo apt-get install libatk-1.0-0 libxkbcommon0 libx11-xcb1

# Ou usar Docker
docker-compose up
```

3. Executar servidor:
```bash
npm start
```

4. Escanear QR code que aparece no terminal

## 🛠️ Estrutura de Pastas

```
src/
├── server.js           # Entry point
├── config.js           # Configurações
├── db.js              # Database
├── auth.js            # Autenticação
├── router.js          # Lógica de mensagens
├── whatsapp.js        # Integração WhatsApp
├── api.js             # Rotas API
├── auth-routes.js     # Autenticação
├── admin-routes.js    # Admin APIs
├── views-routes.js    # Páginas HTML
└── views/             # Templates EJS
    ├── login.ejs
    ├── register.ejs
    ├── crm/
    │   ├── dashboard.ejs
    │   ├── contacts.ejs
    │   ├── contact-detail.ejs
    │   └── rules.ejs
    └── admin/
        ├── login.ejs
        ├── dashboard.ejs
        └── tenants.ejs
```

## 📊 API Examples

### Autenticação

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo123"
  }'

# Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "tenant": { "id": "...", "name": "Demo Company" }
}
```

### Contatos

```bash
# Listar
curl http://localhost:3000/api/contacts \
  -H "Authorization: Bearer TOKEN"

# Criar
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "phone": "+5511999999999",
    "name": "João Silva",
    "email": "joao@example.com"
  }'

# Mensagens
curl http://localhost:3000/api/contacts/CONTACT_ID/messages \
  -H "Authorization: Bearer TOKEN"

# Enviar
curl -X POST http://localhost:3000/api/contacts/CONTACT_ID/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "message": "Olá! Como posso ajudar?"
  }'
```

### Regras

```bash
# Listar
curl http://localhost:3000/api/rules \
  -H "Authorization: Bearer TOKEN"

# Criar
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "trigger": "olá",
    "response": "Olá! Bem-vindo ao nosso atendimento"
  }'
```

### Admin APIs

```bash
# Stats
curl http://localhost:3000/admin/api/stats \
  -H "X-Admin-Token: admin_panel_secret_key"

# Tenants
curl http://localhost:3000/admin/api/tenants \
  -H "X-Admin-Token: admin_panel_secret_key"

# Usage
curl http://localhost:3000/admin/api/usage \
  -H "X-Admin-Token: admin_panel_secret_key"
```

## 🐳 Docker

```bash
# Build
docker build -t crm-saas .

# Run
docker run -p 3000:3000 crm-saas

# Com compose
docker-compose up
```

## 📈 Próximos Passos

1. **Customizar respostas**: Adicionar IA/integração com modelo de linguagem
2. **Webhooks**: Permitir integrações externas
3. **Escalabilidade**: Message queue, múltiplas instâncias
4. **Melhorar UI**: Adicionar mais recursos visuais
5. **Testes**: Unit tests, integration tests
6. **Monitoring**: Sentry, Datadog, etc

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
# Reiniciar node_modules
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Port 3000 already in use"
```bash
# Mudar porta no .env
PORT=3001
```

### Erro do WhatsApp: "libatk-1.0.so.0"
```bash
# Desabilitar temporariamente ou instalar deps
# Ver seção WhatsApp Integration acima
WHATSAPP_ENABLED=false
```

### Banco de dados vazio
```bash
npm run db:init
```

## 📞 Suporte

Criar issue no GitHub ou consultar [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Status**: MVP pronto para usar! ✅
