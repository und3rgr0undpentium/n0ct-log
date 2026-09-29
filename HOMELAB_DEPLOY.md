# Deploying `n0ct.log` to Your Homelab

A complete guide to self-hosting this blog on your own server (bare-metal, Proxmox VM, Raspberry Pi 4+, or any x86/arm64 Linux box). Two paths below — pick one.

---

## Prerequisites
- Linux host (Ubuntu 22.04+/Debian 12+/Fedora 40+ tested).
- A domain name pointing at your server's public IP (optional but recommended for HTTPS).
- Root / sudo access.
- Ports **80** and **443** open on the firewall / router.

---

## Path A — Docker Compose (recommended, easiest)

Everything runs in containers: MongoDB, FastAPI backend, React build served by Nginx, and Caddy as a reverse proxy with **automatic HTTPS**.

### 1. Install Docker + Compose
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out & back in
```

### 2. Get the code onto your server
```bash
git clone <your-repo-url> n0ct-log
cd n0ct-log
```
(or `scp -r /app user@homelab:~/n0ct-log`)

### 3. Create production env files

**`backend/.env`**
```env
MONGO_URL=mongodb://mongo:27017
DB_NAME=n0ct_blog
CORS_ORIGINS=https://blog.your-domain.tld
EMERGENT_LLM_KEY=sk-emergent-...       # your key from Emergent dashboard
JWT_SECRET=<paste `openssl rand -hex 32` output here>
```

**`frontend/.env.production`**
```env
REACT_APP_BACKEND_URL=https://blog.your-domain.tld
```

### 4. Create `docker-compose.yml` at project root
```yaml
services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    volumes: [ "mongo_data:/data/db" ]

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    env_file: ./backend/.env
    depends_on: [ mongo ]
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped

  caddy:
    image: caddy:2
    restart: unless-stopped
    ports: [ "80:80", "443:443" ]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on: [ frontend, backend ]

volumes:
  mongo_data: {}
  caddy_data: {}
  caddy_config: {}
```

### 5. Create `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### 6. Create `frontend/Dockerfile`
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# SPA fallback
RUN printf 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri /index.html; } }' \
  > /etc/nginx/conf.d/default.conf
```

### 7. Create `Caddyfile` at project root
```caddy
blog.your-domain.tld {
    encode gzip
    handle /api/* {
        reverse_proxy backend:8001
    }
    handle {
        reverse_proxy frontend:80
    }
}
```
Caddy will auto-fetch & renew Let's Encrypt certs. If you're on a private LAN with no public domain, replace the first line with `:80` and skip HTTPS.

### 8. Launch
```bash
docker compose up -d --build
docker compose logs -f backend
```
Visit `https://blog.your-domain.tld` → boot sequence should fire. Log in at `/admin/login` with `admin / admin123` and **change the password immediately** by re-seeding or via a Mongo shell.

### 9. Backups
```bash
# One-liner Mongo dump — cron this nightly
docker compose exec -T mongo mongodump --archive --db n0ct_blog | gzip > backup-$(date +%F).gz
```

---

## Path B — Bare-metal (no Docker)

For minimalists / anyone already running Nginx.

### 1. System deps
```bash
sudo apt update && sudo apt install -y python3.11 python3.11-venv nodejs npm nginx mongodb
sudo npm i -g yarn pm2
sudo systemctl enable --now mongodb
```

### 2. Backend
```bash
cd /opt/n0ct-log/backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ -r requirements.txt
# Fill in .env as in Path A step 3 (use mongodb://localhost:27017)
pm2 start "uvicorn server:app --host 127.0.0.1 --port 8001" --name n0ct-backend
```

### 3. Frontend
```bash
cd /opt/n0ct-log/frontend
# .env.production as in Path A
yarn install --frozen-lockfile
yarn build
sudo cp -r build/* /var/www/n0ct/
```

### 4. Nginx (`/etc/nginx/sites-available/n0ct`)
```nginx
server {
    listen 80;
    server_name blog.your-domain.tld;

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/n0ct;
        try_files $uri /index.html;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/n0ct /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d blog.your-domain.tld
```

### 5. Auto-start on boot
```bash
pm2 save
pm2 startup           # follow the printed command
sudo systemctl enable nginx mongodb
```

---

## Post-Deploy Checklist

- [ ] Changed the default `admin/admin123` password (delete the doc from Mongo and re-seed, or add a change-password endpoint).
- [ ] Rotated `JWT_SECRET` to a strong random value.
- [ ] Set `CORS_ORIGINS` to your real domain (not `*`).
- [ ] Set up nightly Mongo backups.
- [ ] Optional: put the admin panel behind an extra layer (Cloudflare Access, Tailscale, or Nginx IP allow-list) since it's a solo blog.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Boot sequence hangs, `/api/posts` 404 | Frontend `REACT_APP_BACKEND_URL` doesn't match the domain Nginx/Caddy is serving. |
| TL;DR button spins forever | `EMERGENT_LLM_KEY` missing or out of balance. |
| CORS errors in browser | Backend `CORS_ORIGINS` not set to your frontend origin. |
| Login returns 401 after container rebuild | Mongo volume was wiped — the seed re-runs but you may have edited the admin password. Re-seed. |

Once live, the boot animation is your calling card — send the link, watch the reactions. Enjoy the log, `n0ct`.
