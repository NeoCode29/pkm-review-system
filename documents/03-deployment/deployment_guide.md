# VPS Deployment Guide
## PKM Review Application

**Target**: Ubuntu 22.04 LTS VPS  
**Architecture**: Docker Compose + Nginx Reverse Proxy  
**SSL**: Let's Encrypt (Certbot)

---

> [!IMPORTANT]
> **Local Development vs Production Setup**
> 
> - **Local Development**: Uses Supabase CLI (`npx supabase start`) - See [setup_guide.md](./setup_guide.md)
> - **Production Deployment**: Uses official Supabase Docker Compose from GitHub - This guide
> 
> This deployment guide is for **production VPS deployment only**. For local development, use the Supabase CLI as documented in the setup guide.

---

## Prerequisites

### VPS Requirements
- **CPU**: 4 vCPUs minimum
- **RAM**: 8GB minimum
- **Storage**: 100GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: Public IP with ports 80 and 443 open

### Domain Setup
- Point your domain to VPS IP:
  - `yourdomain.com` → VPS IP
  - `www.yourdomain.com` → VPS IP
  - `api.yourdomain.com` → VPS IP (optional subdomain for API)

---

## Step 1: Initial VPS Setup

### 1.1 Connect to VPS
```bash
ssh root@your-vps-ip
```

### 1.2 Create Non-Root User
```bash
adduser pkm
usermod -aG sudo pkm
su - pkm
```

### 1.3 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.4 Install Required Packages
```bash
sudo apt install -y \
  git \
  curl \
  wget \
  ufw \
  nginx \
  certbot \
  python3-certbot-nginx
```

---

## Step 2: Install Docker & Docker Compose

### 2.1 Install Docker
```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
```

### 2.2 Install Docker Compose
```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

---

## Step 3: Setup Firewall (UFW)

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 4: Clone Application Repository

```bash
# Create application directory
sudo mkdir -p /opt/pkm-review
sudo chown $USER:$USER /opt/pkm-review
cd /opt/pkm-review

# Clone repository
git clone https://github.com/your-org/pkm-review.git .

# Or upload files via scp/rsync
```

---

## Step 5: Configure Environment Variables

```bash
# Copy and edit environment file
cp .env.example .env
nano .env
```

**Update the following in `.env`**:
```bash
# PRODUCTION SETTINGS
POSTGRES_PASSWORD=your-strong-password-here
JWT_SECRET=your-strong-jwt-secret-with-min-32-characters

# URLs (replace yourdomain.com)
API_EXTERNAL_URL=https://api.yourdomain.com
SITE_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# SMTP (for email verification)
SMTP_ADMIN_EMAIL=admin@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Disable auto-confirm in production
MAILER_AUTOCONFIRM=false

# Generate new API keys for production
ANON_KEY=<generate-new>
SERVICE_ROLE_KEY=<generate-new>
```

**Generate new JWT keys** (recommended for production):
```bash
# Generate random JWT secret
openssl rand -base64 32

# Generate Supabase keys using JWT secret
# Use online tool: https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
```

---

## Step 6: Configure Nginx

### 6.1 Create Nginx Configuration

```bash
sudo mkdir -p /opt/pkm-review/nginx/conf.d
sudo nano /opt/pkm-review/nginx/conf.d/pkm-review.conf
```

**Content** (see `nginx.conf` file in repository)

### 6.2 Test Nginx Configuration
```bash
sudo nginx -t
```

---

## Step 7: SSL Certificate with Let's Encrypt

### 7.1 Obtain SSL Certificate

**Option A: Using Certbot (Recommended)**
```bash
# Stop nginx if running
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com --email admin@yourdomain.com --agree-tos --no-eff-email

# Certificates will be saved to:
# /etc/letsencrypt/live/yourdomain.com/
```

**Option B: Using Docker Certbot (in docker-compose)**
```bash
# First, comment out SSL lines in nginx config
# Start only nginx service
docker-compose up -d nginx

# Run certbot
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d yourdomain.com -d www.yourdomain.com

# Restart nginx after obtaining certs
docker-compose restart nginx
```

### 7.2 Auto-Renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot auto-renewal is handled by docker-compose certbot service
```

---

## Step 8: Build Docker Images

### 8.1 Build Backend (NestJS)
```bash
cd /opt/pkm-review
docker-compose build backend
```

### 8.2 Build Frontend (Next.js)
```bash
docker-compose build frontend
```

---

## Step 9: Run Database Migrations

### 9.1 Start PostgreSQL Only
```bash
docker-compose up -d postgres
```

### 9.2 Wait for PostgreSQL to be ready
```bash
docker-compose logs -f postgres
# Wait until you see "database system is ready to accept connections"
```

### 9.3 Run Prisma Migrations
```bash
# From your local machine or build container
docker-compose exec backend npx prisma migrate deploy

# Or build a temporary container
docker run --rm \
  --network pkm-review_pkm-network \
  -v $(pwd)/backend:/app \
  -w /app \
  -e DATABASE_URL="postgresql://postgres:your-password@postgres:5432/postgres" \
  node:18-alpine \
  sh -c "npm install && npx prisma migrate deploy"
```

### 9.4 Seed Database (Optional)
```bash
docker-compose exec backend npm run seed
```

---

## Step 10: Start All Services

```bash
cd /opt/pkm-review
docker-compose up -d
```

**Verify all services are running**:
```bash
docker-compose ps
```

Expected output:
```
NAME                STATUS              PORTS
pkm-postgres        Up                  0.0.0.0:5432->5432/tcp
pkm-auth            Up                  0.0.0.0:9999->9999/tcp
pkm-storage         Up                  0.0.0.0:5000->5000/tcp
pkm-rest            Up                  0.0.0.0:3001->3000/tcp
pkm-backend         Up                  0.0.0.0:4000->4000/tcp
pkm-frontend        Up                  0.0.0.0:3000->3000/tcp
pkm-nginx           Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
pkm-certbot         Up
```

---

## Step 11: Verify Deployment

### 11.1 Check Service Health
```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:4000/api/health

# Supabase Auth
curl http://localhost:9999/health
```

### 11.2 Check Nginx Routing
```bash
# Test via domain (after DNS propagation)
curl https://yourdomain.com
curl https://api.yourdomain.com/health
```

### 11.3 View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

---

## Step 12: Setup Systemd Service (Auto-Start on Boot)

### 12.1 Create Systemd Service
```bash
sudo nano /etc/systemd/system/pkm-review.service
```

**Content**:
```ini
[Unit]
Description=PKM Review Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/pkm-review
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=pkm

[Install]
WantedBy=multi-user.target
```

### 12.2 Enable Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable pkm-review.service
sudo systemctl start pkm-review.service

# Check status
sudo systemctl status pkm-review.service
```

---

## Step 13: Backup Strategy

### 13.1 Database Backup Script
```bash
sudo nano /opt/pkm-review/scripts/backup-db.sh
```

**Content**:
```bash
#!/bin/bash
BACKUP_DIR="/opt/pkm-review/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="postgres_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U postgres postgres > "$BACKUP_DIR/$FILENAME"

# Compress backup
gzip "$BACKUP_DIR/$FILENAME"

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME.gz"
```

```bash
chmod +x /opt/pkm-review/scripts/backup-db.sh
```

### 13.2 Setup Cron for Daily Backups
```bash
crontab -e
```

**Add**:
```bash
# Daily database backup at 2 AM
0 2 * * * /opt/pkm-review/scripts/backup-db.sh >> /opt/pkm-review/logs/backup.log 2>&1
```

---

## Step 14: Monitoring & Maintenance

### 14.1 View Resource Usage
```bash
docker stats
```

### 14.2 Update Application
```bash
cd /opt/pkm-review

# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Run migrations if needed
docker-compose exec backend npx prisma migrate deploy
```

### 14.3 View Application Logs
```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f backend
```

---

## Troubleshooting

### Issue: Services won't start
```bash
# Check logs
docker-compose logs

# Restart specific service
docker-compose restart <service-name>

# Rebuild service
docker-compose up -d --build <service-name>
```

### Issue: Database connection error
```bash
# Check if postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Verify DATABASE_URL in .env
```

### Issue: SSL certificate issues
```bash
# Renew certificates
sudo certbot renew

# Or with docker
docker-compose run --rm certbot renew
docker-compose restart nginx
```

### Issue: Out of disk space
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove old backups
find /opt/pkm-review/backups -name "*.sql.gz" -mtime +30 -delete
```

---

## Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Generate new JWT secrets for production
- [ ] Enable firewall (UFW)
- [ ] Setup SSL/TLS certificates
- [ ] Disable SSH root login
- [ ] Use SSH keys instead of passwords
- [ ] Enable automatic security updates
- [ ] Setup database backups
- [ ] Configure fail2ban for SSH protection
- [ ] Review nginx security headers
- [ ] Disable MAILER_AUTOCONFIRM in production
- [ ] Setup monitoring (optional but recommended)

---

## Performance Optimization

### Enable Docker Logging Limits
Edit `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

### Database Performance
```bash
# Increase PostgreSQL shared_buffers
# Edit docker-compose.yml postgres service:
command: postgres -c shared_buffers=256MB -c max_connections=200
```

---

**Deployment Complete!** 🎉

Your PKM Review application should now be accessible at:
- Frontend: https://yourdomain.com
- API: https://api.yourdomain.com
- Swagger Docs: https://api.yourdomain.com/api/docs
