# Database Migration Guide
## PKM Review Application - Prisma Migrations

> **Purpose**: Best practices for managing database schema changes safely and reliably.

---

## 🎯 Migration Philosophy

**Goals**:
- Zero downtime deployments
- Reversible changes
- Data integrity maintained
- Team coordination

**Golden Rules**:
1. Never edit migrations after creation
2. Always test migrations locally first
3. Migrations should be atomic
4. Include rollback strategy

---

## 📋 Prisma Migration Basics

### Migration Workflow

```
1. Edit schema.prisma
2. Create migration
3. Review generated SQL
4. Test locally
5. Commit to Git
6. Deploy to environments
```

---

## 🔧 Creating Migrations

### 1. Development Migration

```bash
cd backend

# Edit schema.prisma first
# Then create migration
npx prisma migrate dev --name add_team_status_field

# Prisma will:
# - Generate SQL migration file
# - Apply it to database
# - Regenerate Prisma Client
```

### 2. Migration File Location

```
backend/prisma/migrations/
└── 20260204080000_add_team_status_field/
    └── migration.sql
```

### 3. Review Generated SQL

**Always review before committing**:
```sql
-- migration.sql
-- AlterTable
ALTER TABLE "team" ADD COLUMN "status" VARCHAR(50) NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE INDEX "team_status_idx" ON "team"("status");
```

---

## ✅ Safe Migration Patterns

### Adding New Column

**✅ Safe** (with default value):
```prisma
model Team {
  id       BigInt  @id @default(autoincrement())
  status   String  @default("active") @db.VarChar(50) // ✅ Has default
}
```

**❌ Unsafe** (without default, existing rows):
```prisma
model Team {
  id       BigInt  @id @default(autoincrement())
  status   String  @db.VarChar(50) // ❌ No default, will fail if data exists
}
```

**Solution for existing data**:
```sql
-- Step 1: Add nullable column
ALTER TABLE "team" ADD COLUMN "status" VARCHAR(50);

-- Step 2: Update existing rows
UPDATE "team" SET "status" = 'active' WHERE "status" IS NULL;

-- Step 3: Make NOT NULL
ALTER TABLE "team" ALTER COLUMN "status" SET NOT NULL;
```

---

### Renaming Column

**❌ Don't do this** (data loss risk):
```prisma
model Team {
  // namaTeam String // Removed
  teamName String    // Added - Prisma sees as delete + create
}
```

**✅ Do this instead** (safe, three-step):

**Step 1**: Add new column
```prisma
model Team {
  namaTeam String
  teamName String? // New column, nullable
}
```
```bash
npx prisma migrate dev --name add_team_name_column
```

**Step 2**: Backfill data
```sql
-- In separate migration
UPDATE "team" SET "teamName" = "namaTeam";
```

**Step 3**: Remove old column
```prisma
model Team {
  teamName String // Keep new, remove old
}
```
```bash
npx prisma migrate dev --name remove_nama_team_column
```

---

### Changing Column Type

**❌ Risky**:
```prisma
model Proposal {
  score Int // Was String, now Int - may fail conversion
}
```

**✅ Safe approach**:

1. Add new column
2. Backfill with conversion
3. Test thoroughly
4. Drop old column

```sql
-- Step 1
ALTER TABLE "proposal" ADD COLUMN "score_new" INTEGER;

-- Step 2: Convert with validation
UPDATE "proposal" 
SET "score_new" = CAST("score" AS INTEGER)
WHERE "score" ~ '^[0-9]+$'; -- Only numeric strings

-- Step 3: Verify
SELECT * FROM "proposal" WHERE "score_new" IS NULL;

-- Step 4: Drop old
ALTER TABLE "proposal" DROP COLUMN "score";
ALTER TABLE "proposal" RENAME COLUMN "score_new" TO "score";
```

---

### Adding Required Relationship

**Problem**: Adding required foreign key to table with existing data

**❌ Will fail**:
```prisma
model Proposal {
  teamId BigInt @map("team_id")
  team   Team   @relation(fields: [teamId], references: [id])
}
```

**✅ Safe approach**:

**Step 1**: Add as optional
```prisma
model Proposal {
  teamId BigInt? @map("team_id")
  team   Team?   @relation(fields: [teamId], references: [id])
}
```

**Step 2**: Backfill data
```sql
UPDATE "proposal" p
SET "team_id" = (
  SELECT id FROM "team" t 
  WHERE t.some_condition
)
WHERE p."team_id" IS NULL;
```

**Step 3**: Make required
```prisma
model Proposal {
  teamId BigInt @map("team_id")
  team   Team   @relation(fields: [teamId], references: [id])
}
```

---

## 🚨 Dangerous Operations

### Operations Requiring Extra Care

| Operation | Risk | Mitigation |
|-----------|------|------------|
| Dropping column | **Data loss** | Backup first, test rollback |
| Dropping table | **Data loss** | Archive data, backup |
| Changing type | **Data corruption** | Multi-step migration |
| Adding NOT NULL | **Query failure** | Add with default, then remove |
| Renaming | **Application errors** | Three-step rename |

### Pre-Deployment Checklist

Before dangerous migration:
- [ ] Full database backup taken
- [ ] Tested on staging with production data copy
- [ ] Rollback plan documented
- [ ] Team notified of maintenance window
- [ ] Monitoring ready

---

## 🔄 Rolling Back Migrations

### Development Rollback

```bash
# Undo last migration
npx prisma migrate dev --name rollback

# Or reset database (DESTRUCTIVE)
npx prisma migrate reset
```

### Production Rollback

**Option 1: Restore from Backup**
```bash
# Stop application
docker-compose down

# Restore database
pg_restore -U postgres -d pkm_review backup_before_migration.dump

# Redeploy previous application version
git checkout previous-tag
docker-compose up -d
```

**Option 2: Manual Rollback Migration**
```bash
# Create reverse migration
npx prisma migrate dev --name rollback_add_team_status

# Write SQL to undo changes
# In migration.sql:
ALTER TABLE "team" DROP COLUMN "status";
```

---

## 📝 Migration Naming Conventions

### Good Names

```bash
npx prisma migrate dev --name add_team_status_field
npx prisma migrate dev --name create_proposal_files_table
npx prisma migrate dev --name add_team_member_role_index
npx prisma migrate dev --name update_review_score_calculation
npx prisma migrate dev --name remove_deprecated_user_fields
```

### Bad Names

```bash
npx prisma migrate dev --name update    # ❌ Too vague
npx prisma migrate dev --name fix       # ❌ What fix?
npx prisma migrate dev --name migration # ❌ Not descriptive
npx prisma migrate dev --name v2        # ❌ Not meaningful
```

---

## 🧪 Testing Migrations

### Local Testing

```bash
# 1. Backup current database
pg_dump -U postgres pkm_review > backup_before_test.sql

# 2. Apply migration
npx prisma migrate dev --name test_migration

# 3. Test application
npm run start:dev

# 4. Verify data integrity
npx prisma studio

# 5. If issues, rollback
psql -U postgres -d pkm_review < backup_before_test.sql
```

### Testing with Production Data

```bash
# 1. Copy production data to staging
pg_dump -h prod-db.example.com -U postgres pkm_review > prod_data.sql

# 2. Restore to local/staging
psql -U postgres -d pkm_review_test < prod_data.sql

# 3. Run migration
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/pkm_review_test" \
  npx prisma migrate deploy

# 4. Verify
# - Check row counts
# - Validate data types
# - Test queries
# - Run application tests
```

---

## 📦 Production Deployment

### Deployment Steps

```bash
# 1. Backup production database
pg_dump -U postgres pkm_review > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Put application in maintenance mode (if needed)
docker-compose stop backend frontend

# 3. Apply migrations
docker-compose exec backend npx prisma migrate deploy

# 4. Restart application
docker-compose up -d backend frontend

# 5. Verify
curl https://api.yourdomain.com/health
```

### Zero-Downtime Deployment

**For backward-compatible changes**:

1. Deploy new code (handles both old and new schema)
2. Apply migration
3. Deploy code that only uses new schema

**Example: Adding optional field**
```typescript
// Step 1 deployment: Code handles both
const status = team.status || 'active'; // Works with or without field

// Apply migration
npx prisma migrate deploy

// Step 2 deployment: Use field directly
const status = team.status; // Field now exists
```

---

## 🛠️ Advanced Techniques

### Data Migrations

**Separate data migration from schema migration**:

```bash
# 1. Schema migration
npx prisma migrate dev --name add_team_status

# 2. Data migration script
node scripts/backfill-team-status.js
```

**Data migration script** (`scripts/backfill-team-status.js`):
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update in batches
  const batchSize = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const teams = await prisma.team.findMany({
      where: { status: null },
      take: batchSize,
      skip: page * batchSize,
    });

    if (teams.length === 0) {
      hasMore = false;
      break;
    }

    await prisma.team.updateMany({
      where: {
        id: { in: teams.map(t => t.id) },
      },
      data: { status: 'active' },
    });

    console.log(`Updated ${teams.length} teams`);
    page++;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

### Custom SQL Migrations

**When Prisma can't generate correct SQL**:

```bash
# Create empty migration
npx prisma migrate dev --create-only --name add_custom_index

# Edit generated migration.sql
```

**Example** - Add partial index:
```sql
-- Custom index that Prisma can't generate
CREATE INDEX CONCURRENTLY "proposal_status_submitted_idx" 
ON "proposal" ("status") 
WHERE "status" IN ('submitted', 'under_review');
```

---

## 📊 Migration Best Practices

### DO ✅

- **Review SQL before applying**
- **Test on copy of production data**
- **Backup before migration**
- **Use transactions when possible**
- **Add indexes concurrently in production**
- **Monitor migration performance**
- **Document complex migrations**

### DON'T ❌

- **Edit migration files after creation**
- **Skip testing with real data**
- **Deploy without backup**
- **Run migrations manually in production**
- **Ignore migration warnings**
- **Make breaking changes without planning**

---

## 🐛 Common Issues & Solutions

### Issue: Migration Diverged

```
Error: Database schema is not in sync with migration history
```

**Solution**:
```bash
# Check migration status
npx prisma migrate status

# If development, reset
npx prisma migrate reset

# If production, investigate and resolve manually
```

---

### Issue: Migration Failed Mid-Way

```
Error: Migration failed during execution
```

**Solution**:
```bash
# 1. Check what was applied
psql -U postgres -d pkm_review -c "\d+ table_name"

# 2. Mark migration as rolled back
npx prisma migrate resolve --rolled-back "20260204_migration_name"

# 3. Fix issue and retry
npx prisma migrate deploy
```

---

## 📋 Migration Checklist

### Before Creating Migration

- [ ] Schema changes reviewed
- [ ] Backward compatibility considered
- [ ] Data migration plan exists
- [ ] Rollback strategy defined

### Before Deploying

- [ ] Tested on local database
- [ ] Tested with production data copy
- [ ] Backup plan in place
- [ ] Team notified
- [ ] Monitoring ready

### After Deploying

- [ ] Verify application works
- [ ] Check data integrity
- [ ] Monitor performance
- [ ] Update documentation if needed

---

**Migrations done right = Stress-free deployments!** 🚀
