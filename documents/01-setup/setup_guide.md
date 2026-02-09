# Setup Guide - PKM Review Application
## Local Development Setup

This guide will help you set up the PKM Review application for local development using **Supabase CLI** for infrastructure and manual setup for backend/frontend.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Comes with Node.js
- **Docker Desktop**: For running Supabase stack ([Download](https://www.docker.com/products/docker-desktop))
- **Git**: For version control
- **(Optional) VS Code**: Recommended IDE

---

## 1. Clone the Repository

```powershell
git clone <repository-url>
cd Review PKM
```

---

## 2. Install Supabase CLI and Start Stack

### 2.1 Install Supabase CLI as Dev Dependency

```powershell
npm install supabase --save-dev
```

### 2.2 Initialize Supabase

```powershell
npx supabase init
```

This creates a `supabase/` directory with configuration files.

### 2.3 Start Supabase Services

```powershell
npx supabase start
```

**Wait 2-3 minutes** for all Docker images to download and containers to start.

Once complete, you'll see output with service URLs and credentials. **Copy these credentials** for later use.

### 2.4 Get Supabase Credentials

Run this anytime to view credentials:

```powershell
npx supabase status
```

You'll see:
- **Database URL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **API URL**: `http://127.0.0.1:54321`
- **Studio URL**: `http://127.0.0.1:54323`
- **Publishable Key**: `sb_publishable_...`
- **Secret Key**: `sb_secret_...`

---

## 3. Backend Setup (NestJS)

### 3.1 Navigate to Backend Directory

```powershell
cd backend
```

### 3.2 Install Dependencies

**Option A: Using the Script**
```powershell
.\install-deps.ps1
```

**Option B: Manual Install**
```powershell
npm install

# Then generate Prisma client
npx prisma generate
```

### 3.3 Configure Environment Variables

The `backend/.env` file has been configured with local development credentials. Verify it contains:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres?schema=public"
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_PUBLISHABLE_KEY="<from-supabase-status>"
SUPABASE_SECRET_KEY="<from-supabase-status>"
# ... other variables
```

### 3.4 Run Database Migrations

```powershell
npx prisma migrate dev --name init
npx prisma generate
```

This will:
- Create all database tables from `prisma/schema.prisma`
- Generate TypeScript types for Prisma Client

### 3.5 (Optional) Seed Database

If you have seed data:

```powershell
npx prisma db seed
```

### 3.6 Start NestJS Development Server

```powershell
npm run start:dev
```

Backend will run on **http://localhost:4000**

API documentation (Swagger) available at: **http://localhost:4000/api/docs**

---

## 4. Frontend Setup (Next.js)

### 4.1 Navigate to Frontend Directory

Open a **new terminal window**:

```powershell
cd frontend
```

### 4.2 Install Dependencies

**Option A: Using the Script**
```powershell
.\install-deps.ps1
```

**Option B: Manual Install**
```powershell
npm install
```

### 4.3 Configure Environment Variables

The `frontend/.env.local` file has been configured with local development credentials. Verify it contains:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<from-supabase-status>"
```

### 4.4 Start Next.js Development Server

```powershell
npm run dev
```

Frontend will run on **http://localhost:3000**

---

## 5. Access the Application

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **API Docs (Swagger)**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **Supabase Studio**: [http://127.0.0.1:54323](http://127.0.0.1:54323)
  - Database browser
  - Table editor
  - SQL editor
  - Storage buckets manager
  - Auth users manager
- **Mailpit (Email Testing)**: [http://127.0.0.1:54324](http://127.0.0.1:54324)

---

## 6. Development Workflow

### Daily Development Steps

1. **Start Supabase** (if not running):
   ```powershell
   npx supabase start
   ```

2. **Start Backend** (Terminal 1):
   ```powershell
   cd backend
   npm run start:dev
   ```

3. **Start Frontend** (Terminal 2):
   ```powershell
   cd frontend
   npm run dev
   ```

### Stopping Services

**Stop Backend/Frontend**: `Ctrl + C` in respective terminals

**Stop Supabase**:
```powershell
npx supabase stop
```

**Stop Supabase and Delete Data**:
```powershell
npx supabase stop --no-backup
```

---

## 7. Useful Commands

### Supabase CLI

```powershell
# View all credentials and service URLs
npx supabase status

# Open Supabase Studio in browser
npx supabase studio

# View logs
npx supabase logs

# Reset database (WARNING: deletes all data)
npx supabase db reset

# Stop services
npx supabase stop
```

### Prisma

```powershell
# Navigate to backend directory first: cd backend

# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration-name>

# Apply pending migrations
npx prisma migrate deploy

# Open Prisma Studio (Database GUI)
npx prisma studio

# Reset database and apply migrations
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Backend (NestJS)

```powershell
# Navigate to backend directory first: cd backend

# Start development server (with watch mode)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

### Frontend (Next.js)

```powershell
# Navigate to frontend directory first: cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Format code with Prettier
npm run format
```

---

## 8. Troubleshooting

### Supabase Won't Start

**Error**: Docker not running
- **Solution**: Start Docker Desktop

**Error**: Port already in use (54321, 54322, 54323)
- **Solution**: Stop other services using these ports or change Supabase config

```powershell
# Stop all Docker containers
docker kill $(docker ps -q)

# Then restart Supabase
npx supabase start
```

### Database Connection Issues

**Error**: `Can't reach database server`
- **Solution**: Ensure Supabase is running (`npx supabase status`)
- Check `DATABASE_URL` in `backend/.env` matches Supabase database URL

### Prisma Migration Failures

**Error**: Migration failed
- **Solution**: Reset database and re-run migrations

```powershell
cd backend
npx prisma migrate reset
npx prisma migrate dev --name init
```

### Frontend Can't Connect to Backend

- Verify backend is running on port 4000
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is `http://localhost:4000`
- Check CORS settings in backend允许 `http://localhost:3000`

### Port Already in Use

**Backend (Port 4000)**:
```powershell
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**Frontend (Port 3000)**:
```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 9. Next Steps

After successful setup:

1. **Explore Supabase Studio**: Create test users, view tables
2. **Test Authentication**: Try registering and logging in
3. **Upload Test Files**: Test file upload to Supabase Storage
4. **Review API Docs**: Explore endpoints at http://localhost:4000/api/docs
5. **Start Development**: Begin implementing features!

---

## Additional Resources

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **NestJS Documentation**: https://docs.nestjs.com/
- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs/

**Happy Coding!** 🚀
