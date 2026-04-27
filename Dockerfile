FROM node:20-alpine AS builder

WORKDIR /app

ENV CI=true

COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

COPY backend ./

RUN npm run build

FROM node:20-alpine

RUN addgroup --gid 2000 --system appgroup && \
    adduser --uid 2000 --system appuser --gid 2000

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

RUN npm ci --legacy-peer-deps --omit=dev && \
    npm cache clean --force

EXPOSE 9000

CMD ["npm", "run", "start"]