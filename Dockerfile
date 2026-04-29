# ============================================================
# R U Socrates — Docker build
#
# Build:
#   docker build -t ru-socrates .
#
# Run (development):
#   cp services/.env.example services/.env
#   # edit services/.env with your API keys
#   docker-compose up --build
#
# Run (production — single image, serves both frontend & backend):
#   docker run -d -p 3000:3000 -p 8000:8000 \
#     -e DASHSCOPE_API_KEY=sk-... \
#     ru-socrates
# ============================================================

# ---- Frontend build stage ----
FROM node:20-alpine AS frontend

WORKDIR /app

COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY apps/web ./apps/web
COPY packages ./packages
COPY tsconfig.base.json ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=http://localhost:8000

RUN npm run build

# ---- Production image ----
FROM python:3.10-slim

WORKDIR /app

# Runtime deps (nginx to serve Next.js)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl nginx \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY services/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code
COPY services/ ./services/

# Copy Next.js standalone build
COPY --from=frontend /app/apps/web/.next/standalone ./
COPY --from=frontend /app/apps/web/.next/static ./.next/static
COPY --from=frontend /app/apps/web/public ./public

# Data dir for SQLite
RUN mkdir -p /app/data

# ---- Nginx config for Next.js standalone ----
RUN printf '%s\n' \
    'server {' \
    '    listen 3000;' \
    '    server_name _;' \
    '    server_tokens off;' \
    '    client_max_body_size 256m;' \
    '' \
    '    location /_next/static {' \
    '        alias /app/.next/static;' \
    '        expires 1y;' \
    '        add_header Cache-Control "public, immutable";' \
    '    }' \
    '' \
    '    location / {' \
    '        proxy_pass http://127.0.0.1:3001;' \
    '        proxy_http_version 1.1;' \
    '        proxy_set_header Upgrade $http_upgrade;' \
    '        proxy_set_header Connection "upgrade";' \
    '        proxy_set_header Host $host;' \
    '        proxy_set_header X-Real-IP $remote_addr;' \
    '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' \
    '        proxy_set_header X-Forwarded-Proto $scheme;' \
    '    }' \
    '}' \
    > /etc/nginx/sites-available/nextjs

RUN ln -sf /etc/nginx/sites-available/nextjs /etc/nginx/sites-enabled/ \
    && rm /etc/nginx/sites-enabled/default

ENV PYTHONUNBUFFERED=1
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000 8000

# Start nginx + FastAPI backend
CMD service nginx start \
    && NEXT_PORT=3001 python -c "import uvicorn; uvicorn.run('services.api.main:app', host='0.0.0.0', port=8000, reload=False)"
