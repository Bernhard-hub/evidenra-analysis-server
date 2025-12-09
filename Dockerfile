# EVIDENRA Analyse Server - Production Dockerfile
# WICHTIG: Dieser Container enthält den geschützten Code

FROM node:20-alpine

# Security: Non-root user
RUN addgroup -g 1001 -S evidenra && \
    adduser -S evidenra -u 1001

WORKDIR /app

# Dependencies zuerst (Cache-Optimierung)
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Source Code
COPY src/ ./src/

# KEINE Source Maps in Production!
ENV NODE_ENV=production

# Security Headers
ENV HELMET_CSP=true

# Port
EXPOSE 3001

# Non-root User
USER evidenra

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "src/index.js"]
