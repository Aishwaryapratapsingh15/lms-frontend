# Deployment — lms-frontend

- Path: `/var/www/lms-frontend`
- Port: `3014` (host)
- Domain: `leadflow.eicetechnology.com`

## 1. Get the code

```bash
cd /var/www/lms-frontend
git pull            # or: git clone <repo-url> /var/www/lms-frontend
```

## 2. Env file

Create `/var/www/lms-frontend/.env` (not committed to git):

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.leadflow.eicetechnology.com
```

`NEXT_PUBLIC_*` vars are baked into the client bundle at **build time**, so any
change here needs a rebuild, not just a restart.

## 3. Build and run

```bash
cd /var/www/lms-frontend
docker compose build
docker compose up -d
```

## 4. Nginx

`/etc/nginx/sites-available/leadflow.eicetechnology.com`:

```nginx
server {
    listen 80;
    server_name leadflow.eicetechnology.com;
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3014;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/leadflow.eicetechnology.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d leadflow.eicetechnology.com   # first time only
```

## 5. Redeploy (every update)

```bash
cd /var/www/lms-frontend
git pull
docker compose build
docker compose up -d
```

## Useful commands

```bash
docker compose logs -f
docker compose restart
docker compose down
```
