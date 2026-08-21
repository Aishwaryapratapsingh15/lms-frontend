# Deployment Guide — lms-frontend

Deploys this Next.js 16 app as a Docker container on a Linux VPS, reverse-proxied
by Nginx, served at **https://leadflow.eicetechnology.com**.

- App directory on server: `/var/www/lms-frontend`
- Container port (host): `3014` (chosen because 3000 is already in use by another app)
- Process manager: Docker (`restart: unless-stopped`), so no PM2/systemd needed for the app itself

---

## 1. One-time server setup

SSH into the VPS as a sudo-capable user.

### 1.1 Install Docker + Docker Compose plugin

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# allow running docker without sudo (log out/in after this)
sudo usermod -aG docker $USER
```

Verify:

```bash
docker --version
docker compose version
```

### 1.2 Install Nginx + Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 1.3 Firewall

Only 80/443 (and SSH) need to be open publicly. Port 3014 stays bound to
`127.0.0.1`/localhost via the Docker port mapping and Nginx proxy — it does not
need to be opened in the firewall.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable   # if not already enabled
```

### 1.4 DNS

Make sure `leadflow.eicetechnology.com` has an A record pointing at the VPS's
public IP before requesting the SSL certificate in step 4.

---

## 2. Get the code onto the server

```bash
sudo mkdir -p /var/www/lms-frontend
sudo chown $USER:$USER /var/www/lms-frontend
git clone <your-repo-url> /var/www/lms-frontend
cd /var/www/lms-frontend
```

For subsequent deploys, see section 6 (redeploy).

---

## 3. Configure environment variables

Create `/var/www/lms-frontend/.env.production` (this file is **not** committed
to git — it's read by `docker-compose.yml` via `env_file` and by the Dockerfile
build stage via the `NEXT_PUBLIC_API_BASE_URL` build arg):

```bash
# .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.leadflow.eicetechnology.com
```

> `NEXT_PUBLIC_*` variables are baked into the client JS bundle **at build
> time**, so if you change this value you must rebuild the image
> (`docker compose build`), not just restart the container.

Adjust the value to whatever the production backend API URL actually is.

---

## 4. Build and run the container

From `/var/www/lms-frontend`:

```bash
docker compose build
docker compose up -d
```

Check it's up:

```bash
docker compose ps
curl -I http://127.0.0.1:3014
```

---

## 5. Nginx reverse proxy

Create `/etc/nginx/sites-available/leadflow.eicetechnology.com`:

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

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/leadflow.eicetechnology.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.1 Enable HTTPS

```bash
sudo certbot --nginx -d leadflow.eicetechnology.com
```

Certbot will edit the Nginx config to add the SSL server block and redirect
HTTP → HTTPS, and sets up auto-renewal via a systemd timer/cron entry.

---

## 6. Redeploying updates

```bash
cd /var/www/lms-frontend
git pull
docker compose build
docker compose up -d
```

To also clear old dangling images afterwards:

```bash
docker image prune -f
```

---

## 7. Useful commands

```bash
docker compose logs -f          # tail app logs
docker compose restart          # restart without rebuilding
docker compose down             # stop and remove the container
sudo nginx -t                   # test nginx config after edits
sudo systemctl reload nginx     # apply nginx config changes
```
