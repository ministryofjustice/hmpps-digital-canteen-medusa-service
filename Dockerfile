FROM node:20-alpine AS builder

WORKDIR /app

ENV CI=true

COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

COPY backend ./

RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

RUN npm ci --legacy-peer-deps --omit=dev && \
    npm cache clean --force

EXPOSE 9000

CMD ["npm", "run", "start"]