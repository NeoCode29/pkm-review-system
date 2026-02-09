# Troubleshooting Guide
## PKM Review Application

> **Purpose**: Quick reference for common problems and solutions. Update as new issues are discovered.

---

## 🚀 Setup Issues

### Supabase Won't Start

**Error**: `Docker daemon not running`
```
Error response from daemon: Cannot connect to the Docker daemon
```

**Solution**:
1. Start Docker Desktop
2. Wait for Docker to fully start
3. Run `npx supabase start` again

---

**Error**: `Port already in use`
```
Error: Port 54321 is already allocated
```

**Solution**:
```powershell
# Find process using port
netstat -ano | findstr :54321

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or stop all Supabase
npx supabase stop
```

---

### Prisma Migration Fails

**Error**: `Migration failed to apply`
```
Error: P3009: Invalid migration
```

**Solutions**:

**Option 1: Reset database** (Development only)
```bash
npx prisma migrate reset
npx prisma migrate dev --name init
```

**Option 2: Mark migration as applied**
```bash
npx prisma migrate resolve --applied "migration_name"
```

**Option 3: Force schema push** (Development only)
```bash
npx prisma db push --force-reset
```

---

### Environment Variables Not Working

**Issue**: App can't read .env file

**Checklist**:
- [ ] File named exactly `.env` (not `.env.txt`)
- [ ] In correct directory (`backend/.env` for backend)
- [ ] No quotes around values (unless value contains spaces)
- [ ] Restart server after changes
- [ ] No trailing whitespace

**Testing**:
```typescript
console.log('DATABASE_URL:', process.env.DATABASE_URL);
```

---

## 🔐 Authentication Issues

### Login Returns 401

**Possible Causes**:

**1. Wrong credentials**
- Verify email/password in database
- Check user exists: `SELECT * FROM auth.users WHERE email = '...'`

**2. JWT Secret mismatch**
```bash
# Get Supabase JWT secret
npx supabase status | findstr "JWT"

# Update backend/.env
JWT_SECRET=<your-jwt-secret>
```

**3. Supabase Auth not running**
```bash
docker ps | findstr supabase
```

---

### Token Validation Fails

**Error**: `Invalid token signature`

**Solution**:
1. Check `JWT_SECRET` matches between:
   - Backend `.env`
   - Supabase config
2. Verify frontend is getting token:
```typescript
console.log('Token:', localStorage.getItem('access_token'));
```

3. Decode token to check expiry:
```bash
# Use jwt.io or decode programmatically
```

---

## 🗄️ Database Issues

### Can't Connect to Database

**Error**: `ECONNREFUSED ::1:54322`

**Solution**:
1. Check Supabase running: `npx supabase status`
2. Verify DATABASE_URL port is 54322
3. Try 127.0.0.1 instead of localhost:
```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

---

### Prisma Client Type Errors

**Error**: `Property 'xyz' does not exist on type...`

**Cause**: Prisma types out of sync with schema

**Solution**:
```bash
npx prisma generate
```

Always run after:
- Modifying `schema.prisma`
- Pulling new code with schema changes
- Switching branches

---

### Database Constraint Violations

**Error**: `P2002: Unique constraint failed`

**Cause**: Trying to insert duplicate value

**Solution**:
```typescript
// Check for existing record first
const existing = await prisma.team.findUnique({
  where: { namaTeam: dto.namaTeam }
});

if (existing) {
  throw new ConflictException('Team name already exists');
}
```

---

**Error**: `P2003: Foreign key constraint failed`

**Cause**: Referenced record doesn't exist

**Solution**:
```typescript
// Verify reference exists
const jenisPkm = await prisma.jenisPkm.findUnique({
  where: { id: BigInt(dto.jenisPkmId) }
});

if (!jenisPkm) {
  throw new NotFoundException('Invalid jenis PKM');
}
```

---

## 🌐 API Issues

### CORS Errors

**Error**: `Access to fetch at... has been blocked by CORS policy`

**Solution**:

backend/src/main.ts:
```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

---

### Request Body Empty

**Error**: `dto is undefined or null`

**Cause**: Missing body parser middleware

**Solution**:
Ensure in `main.ts`:
```typescript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

---

### Validation Errors Not Showing

**Cause**: ValidationPipe not configured

**Solution**:
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true
  }
}));
```

---

## 📁 File Upload Issues

### File Upload Fails

**Error**: `File too large`

**Solution**:
Check limits:
```typescript
// backend/src/main.ts
app.use(express.json({ limit: '10mb' }));

// Also check Supabase Storage limit in config
```

---

**Error**: `MIME type not allowed`

**Solution**:
Validate file type:
```typescript
if (file.mimetype !== 'application/pdf') {
  throw new BadRequestException('Only PDF files allowed');
}
```

---

### Can't Access Uploaded Files

**Cause**: Wrong file path or permissions

**Solution**:
1. Check file exists in Supabase Storage
2. Verify bucket permissions (public/private)
3. Get signed URL for private files:
```typescript
const { data } = await supabase.storage
  .from('proposals')
  .createSignedUrl(filePath, 3600); // 1 hour
```

---

## 🔄 Development Workflow Issues

### Hot Reload Not Working

**NestJS**:
```bash
# Make sure using start:dev
npm run start:dev

# If still not working, restart
```

**Next.js**:
```bash
# Clear .next folder
rm -rf .next
npm run dev
```

---

### TypeScript Errors in IDE

**Error**: Red squiggly lines but code runs

**Solution**:
1. Restart TypeScript server in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
2. Delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🧪 Testing Issues

### Tests Failing

**Error**: `Cannot find module`

**Solution**:
Update `tsconfig.json` paths for tests:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

**Error**: `Database not found in tests`

**Solution**:
Use in-memory database or test database:
```typescript
// test/setup.ts
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/test_db';
```

---

## 📊 Performance Issues

### Slow API Responses

**Diagnosis**:
```typescript
const start = Date.now();
// ... operation
console.log(`Operation took ${Date.now() - start}ms`);
```

**Common Causes**:

**1. N+1 Query Problem**
```typescript
// Bad ❌
const teams = await prisma.team.findMany();
for (const team of teams) {
  const members = await prisma.teamMember.findMany({ where: { teamId: team.id } });
}

// Good ✅
const teams = await prisma.team.findMany({
  include: { teamMembers: true }
});
```

**2. Missing Database Indexes**
Add indexes to frequently queried fields in Prisma schema:
```prisma
model Team {
  id       BigInt @id @default(autoincrement())
  namaTeam String @unique
  
  @@index([namaTeam]) // Add index
}
```

---

## 🆘 Emergency Fixes

### App Won't Start At All

**Nuclear Option** (Development only):
```bash
# 1. Stop everything
npx supabase stop
docker kill $(docker ps -q)

# 2. Clean install
rm -rf node_modules package-lock.json
npm install

# 3. Reset database
cd backend
npx prisma migrate reset

# 4. Restart Supabase
cd ..
npx supabase start

# 5. Restart dev servers
cd backend && npm run start:dev
cd ../frontend && npm run dev
```

---

## 📚 Getting Help

**Before asking for help, gather**:
1. Error message (full text)
2. Stack trace
3. What you were trying to do
4. What you've tried
5. Relevant code snippet
6. Environment (Node version, OS, etc.)

**Check these first**:
- [ ] Supabase running (`npx supabase status`)
- [ ] Environment variables set correctly
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] No TypeScript compilation errors

---

**💡 When you solve a new issue, add it to this guide!**
