FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

COPY medusa-canteen/backend ./

RUN npm run build


FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./

RUN npm ci --omit=dev

EXPOSE 9000

CMD ["npm", "run", "start"]