FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build?schema=public

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --include=dev
RUN npx playwright install --with-deps chromium
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*
RUN rm -rf /root/.cache/puppeteer \
    && npx puppeteer browsers install chrome \
    && node --input-type=module -e 'import puppeteer from "puppeteer"; import { access } from "node:fs/promises"; const path = await puppeteer.executablePath(); await access(path); console.log(`[Docker] Chrome validado em ${path}`);'

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate --schema=src/prisma/schema.prisma
RUN npm run build

CMD ["node", "dist/worker.js"]
