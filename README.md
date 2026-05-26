# WhatsApp AI CRM

Um SaaS multi-tenant completo com integração WhatsApp e CRM integrado.

## 🚀 Quick Start

```bash
# Instalação
npm install

# Inicializar banco de dados
npm run db:init

# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📋 Estrutura

```
src/
├── server.js          # Entry point
├── config/            # Configurações
├── db/                # Banco de dados
├── auth/              # Autenticação
├── api/               # Rotas REST
├── whatsapp/          # Integração WhatsApp
├── views/             # Templates HTML/EJS
└── utils/             # Utilitários
```

## 🏗️ Arquitetura

- **Multi-tenant**: Um backend para múltiplas empresas
- **Single database**: SQLite (ou Postgres)
- **REST API**: Express.js
- **Frontend**: EJS + Tailwind CSS
- **Autenticação**: JWT + Session

## 🎯 Features

### CRM
- Gerenciar empresas e contatos
- Histórico de mensagens WhatsApp
- Dashboards simples

### Admin Panel
- Gerenciar tenants (empresas)
- Visualizar uso da plataforma
- Configurações globais

### WhatsApp
- Integração via whatsapp-web.js
- Roteamento de mensagens automático
- Respostas via AI/regras

## 📦 Dependências

- **Express**: Framework web
- **SQLite3**: Banco de dados padrão
- **JWT**: Autenticação stateless
- **whatsapp-web.js**: Integração WhatsApp
- **EJS**: Templates HTML
- **Tailwind CSS**: Estilo

## 🔐 Segurança

- Senhas com bcrypt
- JWT para API
- Isolamento de tenant por middleware
- CSRF protection via session

## 📊 Deployment

- Pronto para Heroku, Railway, Render
- Variáveis de ambiente em `.env`
- Suporte para Postgres em produção

---

**Status**: MVP pronto para deploy ✅