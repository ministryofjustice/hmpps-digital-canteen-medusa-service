FROM node:20-bookworm-slim AS base

RUN addgroup --gid 2000 --system appgroup && \
    adduser --uid 2000 --system appuser --gid 2000 --home /home/appuser

WORKDIR /app

ENV NODE_ENV=production
ENV HOME=/home/appuser

FROM base AS builder

ENV CI=true

COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

COPY backend ./
RUN npm run build

FROM base

COPY --from=builder --chown=appuser:appgroup /app ./

RUN mkdir -p /home/appuser/.config && \
    chown -R appuser:appgroup /home/appuser /app

RUN npm ci --legacy-peer-deps --omit=dev && \
    npm cache clean --force

USER 2000
EXPOSE 9000

CMD ["npm", "run", "start"]