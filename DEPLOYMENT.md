# WhatsApp AI CRM - Guia de Deployment

## 🚀 Deployment Rápido

### Opção 1: Railway (Recomendado para MVP)

1. Fazer fork do repositório
2. Conectar conta Railway
3. Criar novo projeto → conectar repositório
4. Configurar variáveis de ambiente:

```env
NODE_ENV=production
PORT=3000
BASE_URL=https://seu-app.railway.app
DB_TYPE=sqlite
JWT_SECRET=gerar_uma_chave_segura_aleatoria
SESSION_SECRET=gerar_outra_chave_segura
WHATSAPP_ENABLED=true
ADMIN_EMAIL=seu_email@example.com
ADMIN_PASSWORD=senha_segura
ADMIN_SECRET=admin_token_seguro
```

5. Deploy automático ✅

### Opção 2: Heroku

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login
heroku login

# Criar app
heroku create seu-app-name

# Configurar env
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=gerar_chave_segura
heroku config:set SESSION_SECRET=gerar_outra_chave

# Deploy
git push heroku main
```

### Opção 3: Docker (VPS/Servidor Próprio)

```bash
# Build
docker build -t crm-saas .

# Run
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_TYPE=sqlite \
  -v crm_data:/app/data \
  crm-saas

# Com docker-compose
docker-compose up -d
```

### Opção 4: Render.com

1. Conectar repositório GitHub
2. Criar Web Service
3. Configurar variáveis de ambiente
4. Deploy automático

## 🔐 Segurança em Produção

### 1. Gerar chaves seguras

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. HTTPS

Configurar SSL/TLS (automaticamente em Railway, Heroku, Render)

### 3. Backup do Banco de Dados

```bash
# Backup SQLite
sqlite3 data/crm.db ".dump" > backup.sql

# Ou usar PostgreSQL em produção
DATABASE_URL=postgresql://user:pass@host:5432/crm_saas
```

### 4. Variáveis de Ambiente

Nunca commitar `.env` no repositório. Usar secrets do provider.

## 📊 Monitoramento

### Logs
```bash
# Railway
railway logs

# Heroku
heroku logs --tail

# Docker
docker logs -f container_id
```

### Health Check
```bash
curl https://seu-app.railway.app/api/health
```

## 🔄 Atualizações

```bash
git pull
git push heroku main  # ou push para Railway/Render
```

## 📈 Escalabilidade Futura

- [ ] Múltiplas instâncias WhatsApp (cluster de workers)
- [ ] Redis para sessions
- [ ] PostgreSQL para melhor performance
- [ ] CDN para assets
- [ ] Message queue (Bull, RabbitMQ)

---

**Status**: Pronto para produção MVP ✅
