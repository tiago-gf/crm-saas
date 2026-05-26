# WhatsApp AI CRM - Arquitetura Técnica

## 📐 Visão Geral

Um SaaS multi-tenant completo com integração WhatsApp Web, construído com Node.js + Express e SQLite.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ CRM Login    │  │ CRM App      │  │ Admin Panel  │        │
│  │ Register     │  │ (Contatos,   │  │ (Tenants)    │        │
│  │              │  │  Mensagens)  │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────┬──────────────────────────────────────┘
                         │ HTTP/REST + JWT/Session
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Express.js Server (Node.js)                     │
│                                                               │
│ ┌──────────────────────────────────────────────────────┐    │
│ │  Rotas & Middlewares                                 │    │
│ │  ┌────────────────────────────────────────────────┐  │    │
│ │  │ auth-routes.js    - Login, Register, Admin     │  │    │
│ │  │ api.js            - Contacts, Messages, Rules  │  │    │
│ │  │ admin-routes.js   - Tenant Management          │  │    │
│ │  │ views-routes.js   - HTML Pages (EJS)           │  │    │
│ │  └────────────────────────────────────────────────┘  │    │
│ └──────────────────────────────────────────────────────┘    │
│                         │                                     │
│                         ▼                                     │
│ ┌──────────────────────────────────────────────────────┐    │
│ │  Core Modules                                        │    │
│ │  ┌─────────────────────┐   ┌──────────────────────┐ │    │
│ │  │ auth.js             │   │ db.js                │ │    │
│ │  │ - hashPassword()    │   │ - getDb()            │ │    │
│ │  │ - generateToken()   │   │ - initializeDB()     │ │    │
│ │  │ - Middleware JWT    │   │ - SQL Schema         │ │    │
│ │  └─────────────────────┘   └──────────────────────┘ │    │
│ │  ┌─────────────────────┐   ┌──────────────────────┐ │    │
│ │  │ router.js           │   │ whatsapp.js          │ │    │
│ │  │ - processMessage()  │   │ - startWhatsApp()    │ │    │
│ │  │ - Auto replies      │   │ - Client handler     │ │    │
│ │  └─────────────────────┘   └──────────────────────┘ │    │
│ └──────────────────────────────────────────────────────┘    │
│                         │                                     │
│                         ▼                                     │
│ ┌──────────────────────────────────────────────────────┐    │
│ │  Database (SQLite/Postgres)                          │    │
│ │  ┌────────────────────────────────────────────────┐  │    │
│ │  │ Tables:                                        │  │    │
│ │  │ - tenants                                      │  │    │
│ │  │ - contacts                                     │  │    │
│ │  │ - messages                                     │  │    │
│ │  │ - rules                                        │  │    │
│ │  │ - whatsapp_sessions                            │  │    │
│ │  └────────────────────────────────────────────────┘  │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐  ┌─────────────┐  ┌────────────┐
    │ WhatsApp│  │ File System │  │ Webhooks   │
    │  Web.js │  │ (Database)  │  │ (Future)   │
    │         │  │ data/       │  │            │
    └─────────┘  └─────────────┘  └────────────┘
```

## 🗂️ Estrutura de Diretórios

```
crm-saas/
├── src/
│   ├── server.js              # Entry point, configura Express
│   ├── config.js              # Configurações (env vars)
│   ├── db.js                  # Conexão e schema do banco
│   ├── auth.js                # JWT, hashing, middleware
│   ├── router.js              # Lógica de processamento de mensagens
│   ├── whatsapp.js            # Integração WhatsApp Web.js
│   ├── api.js                 # Rotas REST API (/api/*)
│   ├── auth-routes.js         # Rotas de auth (/auth/*)
│   ├── admin-routes.js        # Rotas admin (/admin/api/*)
│   ├── views-routes.js        # Rotas de páginas HTML
│   └── views/                 # Templates EJS
│       ├── layout.ejs         # Base layout
│       ├── login.ejs
│       ├── register.ejs
│       ├── 404.ejs
│       ├── crm/
│       │   ├── dashboard.ejs
│       │   ├── contacts.ejs
│       │   ├── contact-detail.ejs
│       │   └── rules.ejs
│       └── admin/
│           ├── login.ejs
│           ├── dashboard.ejs
│           └── tenants.ejs
├── scripts/
│   └── init-db.js             # Script de inicialização
├── public/                    # Assets (CSS, JS, imagens)
├── data/                      # SQLite DB + WhatsApp session
├── package.json
├── .env                       # Env vars (development)
├── .env.example               # Template de env vars
├── Dockerfile                 # Docker image
├── docker-compose.yml         # Local dev setup
├── QUICK_START.md             # Guia rápido
├── DEPLOYMENT.md              # Deployment guide
└── README.md
```

## 🔑 Componentes Principais

### 1. **server.js** - Orquestração Principal
- Inicializa Express
- Configura middlewares (body-parser, session, CORS)
- Monta rotas
- Gerencia ciclo de vida (graceful shutdown)

### 2. **Database Layer (db.js)**
- Gerencia conexão SQLite
- Define schema com migrations automáticas
- Exporta `getDb()` para toda aplicação
- Suporte para Postgres em produção

**Schema:**
- `tenants` - Empresas clientes
- `contacts` - Contatos do cliente
- `messages` - Histórico de mensagens
- `rules` - Respostas automáticas
- `whatsapp_sessions` - Estado de conexão

### 3. **Authentication (auth.js)**
- **JWT**: Para API stateless
- **Session**: Para páginas HTML
- **Password Hashing**: bcryptjs
- **Middleware**: Verifica JWT + tenant isolation

```javascript
// Middleware chain
verifyJwtMiddleware → tenantMiddleware → route handler
```

### 4. **WhatsApp Integration (whatsapp.js)**
- Usa `whatsapp-web.js` (estrutura obrigatória do usuário)
- Cria cliente único que escuta mensagens
- Chama `processMessage()` para cada mensagem
- Envia respostas automáticas

**Fluxo:**
```
Mensagem recebida → processMessage() → Procura regra → Envia resposta → Salva BD
```

### 5. **Roteador de Mensagens (router.js)**
- Processa mensagens recebidas
- Cria contato se não existir
- Busca regra de resposta automática
- Salva ambas (recebida e resposta)

### 6. **API Routes (api.js)**
- `/api/contacts` - CRUD de contatos
- `/api/contacts/:id/messages` - Histórico
- `/api/contacts/:id/send` - Enviar mensagem
- `/api/rules` - CRUD de regras

Todas requerem JWT + tenant isolation.

### 7. **Admin Routes (admin-routes.js)**
- `/admin/api/tenants` - Gerenciar tenants
- `/admin/api/stats` - Estatísticas globais
- `/admin/api/usage` - Uso por tenant

Requerem header `X-Admin-Token`.

## 🔐 Multi-Tenancy

Isolamento via:
1. **Database**: Todas as queries filtram por `tenant_id`
2. **Middleware**: Verifica que JWT/session pertence ao tenant
3. **Foreign Keys**: Garante referencial integrity

```javascript
// Exemplo: Buscar contatos do tenant
SELECT * FROM contacts WHERE tenant_id = req.tenantId
```

## 🔄 Fluxo de Requisição

### 1. Autenticação (Login)

```
POST /auth/login
├─ Hash password vs DB
├─ Gerar JWT
├─ Set session cookie
└─ Return token + tenant data
```

### 2. Ação Autenticada (ex: Listar Contatos)

```
GET /api/contacts
│
├─ Middleware: verifyJwtMiddleware
│  └─ Decodifica JWT → req.user
│
├─ Middleware: tenantMiddleware
│  └─ Extrai tenantId → req.tenantId
│
├─ Route Handler
│  └─ SELECT * FROM contacts WHERE tenant_id = ?
│
└─ Return JSON
```

### 3. WhatsApp Mensagem Recebida

```
WhatsApp message
│
├─ Client event: message
│
├─ router.processMessage()
│  ├─ Buscar/criar contact
│  ├─ Salvar mensagem recebida
│  ├─ Buscar regra de resposta
│  └─ Salvar resposta
│
├─ msg.reply(response)
│
└─ Update DB status
```

## 📊 Autenticação & Autorização

### CRM (Tenant)
```
Frontend localStorage: token = JWT
Header: "Authorization: Bearer TOKEN"

JWT contém: { tenantId, email, name }
Middleware valida e extrai tenantId
```

### Admin
```
Frontend localStorage: adminToken = ADMIN_SECRET
Header: "X-Admin-Token: ADMIN_SECRET"

Middleware compara com env var ADMIN_SECRET
```

### Session (Páginas HTML)
```
Cookie: connect.sid = session_id
Server: express-session armazena { user, adminToken }
```

## 🚀 Deployment Architecture

### Development
```
npm start → Node process → SQLite local → WhatsApp (simulado)
```

### Production (Railway/Render/Heroku)
```
Docker container
  ↓
Node.js process
  ↓
SQLite (volume persistence)
  ou Postgres (managed DB)
  ↓
WhatsApp (real phone QR scan)
```

## 🔌 Integrações

### WhatsApp Web (Obrigatório)
- `whatsapp-web.js` library
- Requer browser (Puppeteer/Chrome)
- Precisa de QR scan manual
- Não pode ser usado em múltiplas instâncias (1:1)

### Futuras Integrações
- [ ] IA para respostas inteligentes
- [ ] Webhooks para clientes
- [ ] SMS gateway
- [ ] Telegram bot
- [ ] Slack notifications

## 📈 Escalabilidade

### MVP (Atual)
- Single Node.js process
- SQLite
- 1 instância WhatsApp
- até ~100 tenants

### Próximo (Escalável)
- PM2 cluster mode
- PostgreSQL + Redis
- Message queue (Bull/RabbitMQ)
- Múltiplas instâncias WhatsApp via workers
- Load balancer

## 🛡️ Segurança

- ✅ Password hashing (bcrypt)
- ✅ JWT token expiry
- ✅ Tenant isolation
- ✅ Session httpOnly cookies
- ✅ CORS configured
- ⚠️ Rate limiting (adicionar)
- ⚠️ Input validation (adicionar)
- ⚠️ SQL injection protection (usar prepared statements)

## 📝 Logging & Monitoring

**Atual:**
- Console.log para debug
- Error logs em stderr

**Recomendado:**
- Winston ou Pino para logs estruturados
- Sentry para error tracking
- Datadog para APM
- CloudWatch/Stackdriver para cloud

---

**Versão**: 1.0.0 (MVP)
**Status**: Production Ready ✅
