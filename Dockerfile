FROM node:18

# Instala dependências do sistema (pro Puppeteer)
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  libappindicator3-1 \
  xdg-utils \
  ca-certificates

WORKDIR /app

# Copia apenas package primeiro (cache inteligente)
COPY package.json package-lock.json* ./

# Instala dependências
RUN npm install

# Copia resto do projeto
COPY . .

# Variável para Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Porta
EXPOSE 3000

# IMPORTANTE: NÃO usar --watch em produção
CMD ["node", "src/server.js"]
