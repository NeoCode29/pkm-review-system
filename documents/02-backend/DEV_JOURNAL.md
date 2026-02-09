# Development Journal
## PKM Review Application Backend

> **Purpose**: Living document to track development progress, issues encountered, solutions found, and learnings. Update this as you develop.

---

## 📅 How to Use This Journal

1. **Daily Log**: Add entries when you encounter issues or make decisions
2. **Date Format**: YYYY-MM-DD
3. **Categories**: Use tags [BUG], [DECISION], [LEARNING], [FIXED], [TODO]
4. **Be Specific**: Include code snippets, error messages, solutions

---

## 🆕 Entry Template

```markdown
### [DATE] - [CATEGORY] Brief Title

**Context**: What were you trying to do?

**Issue/Decision**: What went wrong or what decision needed to be made?

**Solution/Outcome**: How did you fix it or what did you decide?

**Code Example** (if applicable):
```typescript
// Code snippet
```

**Related Files**: 
- `path/to/file.ts`

**Lessons Learned**:
- Key takeaway 1
- Key takeaway 2

---
```

---

## 📝 Development Log

### 2026-02-04 - [SETUP] Supabase CLI Integration

**Context**: Setting up local development environment with full Supabase stack

**Issue**: Manual docker-compose setup kept failing with migration hash mismatches on storage service

**Solution**: Switched to official Supabase CLI approach
- Used `npx supabase init` and `npx supabase start`
- Let Supabase handle all migrations automatically
- Ports: 54321 (API), 54322 (DB), 54323 (Studio)

**Related Files**:
- `SUPABASE_CLI_SETUP.md`
- `backend/.env`
- `frontend/.env.local`

**Lessons Learned**:
- Always use official tooling when available
- Don't try to replicate complex setups manually
- Supabase CLI is the source of truth for local dev

---

### 2026-02-04 - [SETUP] Environment Configuration

**Context**: Configured backend and frontend environment variables

**Solution**: 
- Backend uses actual Supabase credentials from `npx supabase status`
- Frontend uses NEXT_PUBLIC_ prefix for client-side variables
- Credentials:
  - DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
  - API: `http://127.0.0.1:54321`
  - Keys: Real publishable/secret keys from Supabase

**Related Files**:
- `backend/.env`
- `frontend/.env.local`

---

## 🔧 Common Issues & Solutions

### Issue: Prisma Client Not Found

**Symptoms**:
```
Error: Cannot find module '@prisma/client'
```

**Solution**:
```bash
cd backend
npm install
npx prisma generate
```

**Why**: Prisma client needs to be generated after schema changes

---

### Issue: Database Connection Refused

**Symptoms**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
1. Check Supabase is running: `npx supabase status`
2. If not running: `npx supabase start`
3. Verify DATABASE_URL uses port 54322 (not 5432)

**Why**: Supabase CLI uses different ports than standard PostgreSQL

---

### Issue: JWT Token Validation Fails

**Symptoms**:
```
401 Unauthorized - Invalid token
```

**Common Causes**:
1. JWT_SECRET mismatch between auth service and backend
2. Token expired
3. Wrong Supabase URL in frontend

**Solution**:
- Verify `JWT_SECRET` in backend/.env matches Supabase
- Check `SUPABASE_URL` in frontend/.env.local
- Use `npx supabase status` to get correct values

---

### Issue: CORS Error in Browser

**Symptoms**:
```
Access to fetch at 'http://localhost:4000' has been blocked by CORS policy
```

**Solution**:
Update backend `main.ts`:
```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true
});
```

**Why**: Backend must explicitly allow frontend origin

---

## 💡 Best Practices Learned

### Prisma Transactions
**Always use**:
```typescript
await prisma.$transaction(async (tx) => {
  // Multiple operations
});
```

**Why**: Ensures data consistency

---

### BigInt Handling
**Problem**: Prisma uses BigInt for IDs, JSON doesn't support BigInt

**Solution**:
```typescript
// Convert to string for API responses
return {
  id: team.id.toString(),
  ...otherFields
};

// Convert from string in requests
const teamId = BigInt(params.id);
```

---

### Error Responses
**Always** return user-friendly messages:
```typescript
try {
  // ...
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException('This record already exists');
    }
  }
  throw new InternalServerErrorException('Something went wrong');
}
```

**Never** expose internal errors to client

---

## 🎯 Architecture Decisions

### Decision: Use Supabase Auth vs Custom JWT

**Date**: 2026-02-04

**Context**: Need authentication for 3 user roles

**Options Considered**:
1. Custom JWT with Passport
2. Supabase Auth (self-hosted)
3. Third-party (Auth0, Clerk)

**Decision**: Supabase Auth (self-hosted)

**Rationale**:
- Integrated with our PostgreSQL
- Row Level Security (RLS) built-in
- Self-hosted = no vendor lock-in
- Good developer experience

**Trade-offs**:
- More infrastructure to manage
- Learning curve for Supabase

---

### Decision: NestJS Module Structure

**Date**: 2026-02-04

**Decision**: Feature-based modules (teams, proposals, reviews, admin)

**Structure**:
```
src/
├── auth/
├── teams/
├── proposals/
├── reviews/
├── admin/
├── common/
└── prisma/
```

**Rationale**:
- Clear separation of concerns
- Easy to navigate
- Scales well
- Follows NestJS best practices

---

## 📊 Performance Notes

### Database Query Optimization

**Always include relations** instead of separate queries:
```typescript
// Good ✅
const team = await prisma.team.findUnique({
  where: { id },
  include: { teamMembers: true, proposals: true }
});

// Bad ❌ (N+1 problem)
const team = await prisma.team.findUnique({ where: { id } });
const members = await prisma.teamMember.findMany({ where: { teamId: id } });
```

---

## 🐛 Known Issues

### None yet - document as you encounter them

Format:
```markdown
### [Issue Title]

**Status**: 🔴 Open / 🟡 In Progress / 🟢 Fixed

**Description**: ...

**Impact**: High/Medium/Low

**Workaround**: ...

**Permanent Fix**: ...
```

---

## 📈 Progress Tracking

### Completed
- [x] Project setup (NestJS, Next.js)
- [x] Supabase CLI integration
- [x] Environment configuration
- [x] Documentation framework

### In Progress
- [ ] Prisma migrations
- [ ] Authentication module
- [ ] Teams module

### Not Started
- [ ] Proposals module
- [ ] Reviews module
- [ ] Admin module
- [ ] Frontend components

---

## 🔗 Quick Reference

**Key Files**:
- `DEVELOPMENT_GUIDE.md` - Development patterns
- `API_CONTRACT.md` - API endpoints spec
- `BUSINESS_RULES.md` - Business logic rules
- `prisma/schema.prisma` - Database schema

**Useful Commands**:
```bash
# Supabase
npx supabase status
npx supabase start
npx supabase stop

# Prisma
npx prisma generate
npx prisma migrate dev
npx prisma studio

# Backend
npm run start:dev

# Frontend
npm run dev
```

---

**✍️ Remember to update this journal as you develop!**
