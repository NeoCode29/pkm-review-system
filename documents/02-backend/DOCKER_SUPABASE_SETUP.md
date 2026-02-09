# Docker Supabase Setup Guide

> **For**: PKM Review Application - Local Development
> **Last Updated**: 2026-02-09
> **Version**: Supabase Self-Hosted (Latest)

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Approach 1: Supabase CLI (Recommended for Development)](#approach-1-supabase-cli-recommended-for-development)
4. [Approach 2: Self-Hosted Docker Setup](#approach-2-self-hosted-docker-setup)
5. [Environment Configuration](#environment-configuration)
6. [Database Migrations](#database-migrations)
7. [Troubleshooting](#troubleshooting)
8. [Everyday Workflow](#everyday-workflow)
9. [Production Considerations](#production-considerations)

---

## Overview

Supabase dapat dijalankan secara lokal menggunakan Docker dengan 2 pendekatan:

| Approach | Best For | Pros | Cons |
|----------|----------|------|------|
| **Supabase CLI** | Local development | Mudah setup, terintegrasi dengan migrations, auto-sync | Kurang kontrol atas config |
| **Self-Hosted Docker** | Production-like env | Full kontrol, custom config | Lebih kompleks setup |

**Untuk development PKM Review, kami rekomendasikan Approach 1 (Supabase CLI).**

---

## Prerequisites

### System Requirements

**Minimum** (Development):
- **RAM**: 4 GB
- **Disk**: 50 GB SSD
- **OS**: Windows 10/11, macOS, atau Linux

**Recommended**:
- **RAM**: 8 GB+
- **Disk**: 80+ GB SSD

### Required Software

#### 1. Git
Download dari [git-scm.com](https://git-scm.com/downloads)

**Verify installation:**
```bash
git --version
```

#### 2. Docker Desktop

**Windows/macOS**: Download dari [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**Linux**: Install Docker Engine + Docker Compose
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin
```

**Verify installation:**
```bash
docker --version
docker compose version
```

#### 3. Node.js (untuk Supabase CLI)
Download dari [nodejs.org](https://nodejs.org/) - versi LTS

**Verify installation:**
```bash
node --version
npm --version
```

---

## Approach 1: Supabase CLI (Recommended for Development)

### 1.1 Install Supabase CLI

**Windows (via npm):**
```bash
npm install -g supabase
```

**macOS (via Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Linux (via npm):**
```bash
npm install -g supabase
```

**Verify installation:**
```bash
supabase --version
```

### 1.2 Initialize Supabase in Your Project

Navigate ke project directory (backend folder):
```bash
cd "c:\Users\kresna\Documents\Antigravity Project\Review PKM"
```

Initialize Supabase:
```bash
supabase init
```

Ini akan membuat struktur folder:
```
.
├── supabase/
│   ├── config.toml
│   ├── seed.sql
│   └── migrations/
```

### 1.3 Start Supabase Locally

```bash
supabase start
```

**Output yang diharapkan:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**✅ Simpan credentials ini!** Anda akan membutuhkannya untuk .env file.

### 1.4 Access Supabase Studio

Buka browser: [http://localhost:54323](http://localhost:54323)

Di sini Anda bisa:
- View dan edit tables
- Manage authentication
- View logs
- Test SQL queries

### 1.5 Configure Backend .env

Create `.env` file di backend project Anda:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Supabase
SUPABASE_URL="http://localhost:54321"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# JWT
JWT_SECRET="super-secret-jwt-token-with-at-least-32-characters-long"

# Server
PORT=3000
NODE_ENV=development
```

**⚠️ Note**: Ganti values dengan output dari `supabase start`

### 1.6 Stop Supabase

```bash
supabase stop
```

To stop and **remove all data** (reset):
```bash
supabase stop --no-backup
```

---

## Approach 2: Self-Hosted Docker Setup

### 2.1 Clone Supabase Repository

```bash
git clone --depth 1 https://github.com/supabase/supabase
```

### 2.2 Create Project Directory

```bash
# Make new project directory
mkdir supabase-local
cd supabase-local

# Copy Docker files
cp -rf ../supabase/docker/* .
cp ../supabase/docker/.env.example .env
```

**Struktur folder:**
```
supabase-local/
├── docker-compose.yml
├── .env
└── volumes/
    ├── db/
    ├── storage/
    └── logs/
```

### 2.3 Configure Environment Variables

Edit `.env` file:

#### 2.3.1 Generate Secrets

**Linux/macOS:**
```bash
# PostgreSQL Password
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env

# JWT Secret (32+ chars)
echo "JWT_SECRET=$(openssl rand -base64 48)" >> .env

# Other secrets
echo "SECRET_KEY_BASE=$(openssl rand -base64 48)" >> .env
echo "VAULT_ENC_KEY=$(openssl rand -hex 16)" >> .env
echo "PG_META_CRYPTO_KEY=$(openssl rand -base64 24)" >> .env
echo "LOGFLARE_PUBLIC_ACCESS_TOKEN=$(openssl rand -base64 24)" >> .env
echo "LOGFLARE_PRIVATE_ACCESS_TOKEN=$(openssl rand -base64 24)" >> .env
```

**Windows (PowerShell):**
```powershell
# Generate random password
$bytes = New-Object Byte[] 32
[Security.Cryptography.RNG]::Create().GetBytes($bytes)
$password = [Convert]::ToBase64String($bytes)
Write-Output "POSTGRES_PASSWORD=$password"
```

Atau gunakan script otomatis:
```bash
sh ./utils/generate-keys.sh
```

#### 2.3.2 Generate API Keys

1. Generate JWT_SECRET (bisa menggunakan command di atas)
2. Generate ANON_KEY dan SERVICE_ROLE_KEY:

Visit [supabase.com/docs/guides/self-hosting/docker#generate-api-keys](https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys) untuk online generator, atau gunakan:

```bash
# Install jwt-cli
npm install -g @tsndr/jwt-cli

# Generate anon key
jwt sign --secret="YOUR_JWT_SECRET" --payload='{"role":"anon","iss":"supabase","iat":1609459200,"exp":1767225600}'

# Generate service_role key
jwt sign --secret="YOUR_JWT_SECRET" --payload='{"role":"service_role","iss":"supabase","iat":1609459200,"exp":1767225600}'
```

#### 2.3.3 Configure URLs (untuk localhost)

```env
SUPABASE_PUBLIC_URL=http://localhost:8000
API_EXTERNAL_URL=http://localhost:8000
SITE_URL=http://localhost:3000
```

### 2.4 Start Supabase Services

```bash
# Pull latest images
docker compose pull

# Start services in background
docker compose up -d

# Check status
docker compose ps
```

**Expected output:**
```
NAME                      STATUS
supabase-kong             Up (healthy)
supabase-db               Up (healthy)
supabase-studio           Up (healthy)
supabase-auth             Up (healthy)
supabase-rest             Up (healthy)
supabase-realtime         Up (healthy)
supabase-storage          Up (healthy)
...
```

**⏱️ Wait 1-2 minutes** untuk semua services menjadi "healthy"

### 2.5 Access Services

- **Supabase Studio**: [http://localhost:3000](http://localhost:3000)
- **API Gateway**: [http://localhost:8000](http://localhost:8000)
- **PostgreSQL**: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres`

### 2.6 Stop Services

```bash
# Stop services
docker compose down

# Stop and remove volumes (WIPE DATA)
docker compose down -v
```

---

## Environment Configuration

### Complete .env Template for Backend

```env
# ===========================
# DATABASE
# ===========================
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:54322/postgres"

# ===========================
# SUPABASE
# ===========================
SUPABASE_URL="http://localhost:54321"
SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# ===========================
# JWT AUTHENTICATION
# ===========================
JWT_SECRET="your-super-secret-jwt-token-min-32-chars"
JWT_EXPIRES_IN="7d"

# ===========================
# SERVER
# ===========================
PORT=3000
NODE_ENV=development

# ===========================
# FILE UPLOAD
# ===========================
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES="application/pdf"

# ===========================
# CORS
# ===========================
CORS_ORIGIN="http://localhost:3001"

# ===========================
# LOGGING
# ===========================
LOG_LEVEL="debug"
```

### Security Checklist

- [ ] ✅ `POSTGRES_PASSWORD` minimal 16 characters, random
- [ ] ✅ `JWT_SECRET` minimal 32 characters  
- [ ] ✅ `ANON_KEY` dan `SERVICE_ROLE_KEY` generated dengan JWT_SECRET yang sama
- [ ] ✅ `.env` file di-gitignore
- [ ] ✅ Create `.env.example` untuk reference (tanpa values)
- [ ] ✅ Semua secrets unique per environment (dev, staging, prod)

---

## Database Migrations

### 6.1 With Supabase CLI

#### Create New Migration

```bash
supabase migration new create_users_table
```

Ini akan create file: `supabase/migrations/<timestamp>_create_users_table.sql`

#### Write Migration SQL

Edit migration file:
```sql
-- supabase/migrations/20260209000001_create_users_table.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'mahasiswa', 'reviewer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

#### Apply Migrations

```bash
# Apply all pending migrations
supabase db reset

# Or just migrate without reset
supabase migration up
```

#### Generate Migration from Schema Changes

Jika Anda membuat perubahan via Studio:

```bash
# Diff changes and create migration
supabase db diff -f create_new_table
```

### 6.2 With Prisma (Recommended for NestJS)

#### Install Prisma

```bash
npm install -D prisma
npm install @prisma/client
```

#### Initialize Prisma

```bash
npx prisma init
```

Edit `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  role      String
  status    String   @default("active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

#### Create Migration

```bash
# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

#### Apply on Supabase

```bash
# Push schema to Supabase
npx prisma db push

# Or use migrations
npx prisma migrate deploy
```

### 6.3 Seed Data

Create `supabase/seed.sql`:
```sql
-- Insert master data
INSERT INTO jenis_pkm (nama, kode) VALUES
  ('PKM-Riset', 'PKM-R'),
  ('PKM-Gagasan Tertulis', 'PKM-GT'),
  ('PKM-Karsya Cipta', 'PKM-KC');

INSERT INTO jurusan (nama, kode) VALUES
  ('Teknik Informatika', 'TI'),
  ('Sistem Informasi', 'SI'),
  ('Teknik Elektro', 'TE');
```

Run seed:
```bash
supabase db reset  # This runs seed.sql automatically
```

---

## Troubleshooting

### Issue 1: Port Already in Use

**Error:**
```
Error: port 54321 is already allocated
```

**Solution:**
```bash
# Find process using port
# Windows
netstat -ano | findstr :54321
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:54321 | xargs kill -9

# Or change port in supabase/config.toml
[api]
port = 54325
```

### Issue 2: Docker Containers Not Healthy

**Error:**
```
supabase-db | container is unhealthy
```

**Solution:**
```bash
# Check logs
docker compose logs db

# Restart services
docker compose down
docker compose up -d

# If persists, remove volumes
docker compose down -v
docker compose up -d
```

### Issue 3: Migrations Failing

**Error:**
```
Failed to apply migration
```

**Solution:**
```bash
# Check migration status
supabase migration list

# Repair migrations
supabase migration repair <version>

# Reset database (CAUTION: deletes data)
supabase db reset
```

### Issue 4: Cannot Connect to Database

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:54322
```

**Solution:**
1. Check if Supabase is running:
   ```bash
   supabase status
   ```

2. Restart Supabase:
   ```bash
   supabase stop
   supabase start
   ```

3. Verify DATABASE_URL in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
   ```

### Issue 5: JWT Authentication Errors

**Error:**
```
Invalid JWT signature
```

**Solution:**
1. Ensure JWT_SECRET matches between Supabase and backend
2. Regenerate keys if needed
3. Check token expiration

### Issue 6: Supabase CLI Not Found

**Error:**
```
'supabase' is not recognized as an internal or external command
```

**Solution (Windows):**
```bash
# Reinstall globally
npm install -g supabase

# Or use npx
npx supabase start
```

---

## Everyday Workflow

### Starting Your Dev Day

```bash
# 1. Start Supabase
supabase start

# 2. Check status
supabase status

# 3. Start backend (di terminal terpisah)
cd backend
npm run start:dev

# 4. Start frontend (di terminal terpisah)
cd frontend
npm run dev
```

### Making Database Changes

```bash
# 1. Create migration
supabase migration new add_new_feature

# 2. Edit migration file
# supabase/migrations/<timestamp>_add_new_feature.sql

# 3. Apply migration
supabase db reset

# 4. Update Prisma schema (if using Prisma)
npx prisma db pull
npx prisma generate
```

### Viewing Logs

```bash
# Supabase logs
supabase logs

# Specific service
docker compose logs db
docker compose logs auth
docker compose logs storage

# Follow logs (real-time)
docker compose logs -f
```

### Backing Up Data

```bash
# Dump database
supabase db dump -f backup.sql

# Restore from backup
psql -h localhost -p 54322 -U postgres -d postgres -f backup.sql
```

### Resetting Everything

```bash
# Reset database to migrations + seed
supabase db reset

# Complete restart (preserve data)
supabase stop
supabase start

# Complete wipe (delete all data)
supabase stop --no-backup
rm -rf supabase/.branches
supabase start
```

### Ending Your Dev Day

```bash
# Stop Supabase (keeps data)
supabase stop

# Or keep running in background (uses resources)
# Just close terminal
```

---

## Production Considerations

### For Production Deployment

**DO NOT use localhost setup!** Instead:

1. **Use Supabase Cloud** ([supabase.com](https://supabase.com)) - Recommended
   - Free tier available
   - Managed backups
   - Auto-scaling
   - Built-in CDN

2. **Or Self-Host on VPS** with:
   - Reverse proxy (Nginx)
   - SSL certificate (Let's Encrypt)
   - Strong passwords
   - Firewall rules
   - Regular backups
   - Monitoring (Prometheus + Grafana)

### Environment Separation

| Environment | Database | Auth | Storage |
|-------------|----------|------|---------|
| Local Dev | Supabase CLI | Local | Local |
| Staging | Supabase Cloud | Supabase Auth | Supabase Storage |
| Production | Supabase Cloud | Supabase Auth | Supabase Storage |

### Migration Strategy

```bash
# Local → Staging
supabase link --project-ref staging-project
supabase db push

# Staging → Production
supabase link --project-ref prod-project
supabase db push
```

---

## Quick Reference

### Essential Commands

```bash
# Supabase CLI
supabase start              # Start local instance
supabase stop               # Stop local instance
supabase status             # Check services status
supabase db reset           # Reset DB + run migrations + seed
supabase migration new      # Create new migration
supabase db diff            # Generate migration from changes

# Docker
docker compose up -d        # Start services
docker compose down         # Stop services
docker compose ps           # Check status
docker compose logs -f      # View logs

# Prisma
npx prisma migrate dev      # Create & apply migration
npx prisma db push          # Push schema changes
npx prisma studio           # Open Prisma Studio
npx prisma generate         # Generate Prisma Client
```

### Default Ports

| Service | Port |
|---------|------|
| Supabase API | 54321 |
| PostgreSQL | 54322 |
| Supabase Studio | 54323 |
| Inbucket (Email) | 54324 |
| Kong (Gateway) | 8000 |

### Important Files

```
project/
├── .env                           # Environment variables
├── .env.example                   # Template (commit this)
├── supabase/
│   ├── config.toml               # Supabase config
│   ├── seed.sql                  # Seed data
│   └── migrations/               # Database migrations
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Prisma schema
│   └── .env                      # Backend env vars
└── docker-compose.yml            # Self-hosted config
```

---

## Next Steps

1. ✅ Setup Supabase locally (Approach 1 or 2)
2. ✅ Configure environment variables
3. ✅ Test database connection
4. 📝 Create initial Prisma schema
5. 📝 Generate first migration
6. 📝 Seed master data
7. 🚀 Start backend development!

---

## Resources

- [Supabase Official Docs](https://supabase.com/docs)
- [Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting/docker)
- [Local Development Guide](https://supabase.com/docs/guides/cli/local-development)
- [Prisma + Supabase Guide](https://www.prisma.io/docs/guides/database/supabase)
- [NestJS + Prisma Guide](https://docs.nestjs.com/recipes/prisma)

---

**Happy Coding! 🚀**
