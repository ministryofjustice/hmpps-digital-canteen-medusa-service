FROM node:20-bookworm-slim AS base

ARG BUILD_NUMBER=1_0_0
ARG GIT_REF=not-available

ENV TZ=Europe/London
RUN ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone

RUN addgroup --gid 2000 --system appgroup && \
    adduser --uid 2000 --system appuser --gid 2000 --home /home/appuser

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV HOME=/home/appuser
ENV BUILD_NUMBER=${BUILD_NUMBER:-1_0_0}

FROM base AS builder

COPY backend/package*.json ./

RUN npm install --legacy-peer-deps

COPY backend/ ./

# Set environment variables for build time
ENV CI=true
ENV DISABLE_MEDUSA_ADMIN=false
ENV MEDUSA_BACKEND_URL=http://localhost:9000

# Build with environment variables set
RUN npm run build

RUN ./node_modules/.bin/tsc instrumentation.ts --outDir . --skipLibCheck

RUN echo "{\"buildNumber\":\"${BUILD_NUMBER}\",\"gitRef\":\"${GIT_REF}\"}" > build-info.json

FROM base

COPY --from=builder --chown=appuser:appgroup \
    /app/package.json \
    /app/package-lock.json \
    ./

RUN npm ci --legacy-peer-deps --omit=dev && \
    npm cache clean --force

COPY --from=builder --chown=appuser:appgroup /app/medusa-config.js ./medusa-config.js
COPY --from=builder --chown=appuser:appgroup /app/instrumentation.js ./instrumentation.js
COPY --from=builder --chown=appuser:appgroup /app/build-info.json ./build-info.json
COPY --from=builder --chown=appuser:appgroup /app/.medusa ./.medusa

COPY --from=builder --chown=appuser:appgroup /app/medusa-config.js ./.medusa/server/medusa-config.js

RUN mkdir -p /home/appuser/.config && \
    chown -R appuser:appgroup /home/appuser /app

USER 2000
ENV NODE_ENV=production
ENV PORT=9000
ENV DISABLE_MEDUSA_TELEMETRY=true
EXPOSE 9000

CMD ["sh", "-c", "npm run db:migrate && cd /app/.medusa/server && npx medusa start"]