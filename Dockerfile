FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV CI=true

COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

COPY backend ./

RUN echo "=== Checking for config file ===" && \
    ls -la medusa-config.* && \
    echo "=== Config file content ===" && \
    cat medusa-config.js || cat medusa-config.ts || echo "No config file found!"

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./

RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

EXPOSE 9000

CMD ["npm", "run", "start"]