# Reference Documentation
## PKM Review Application

> **Purpose**: Central reference for all project documentation

---

## 📚 Documentation Index

### Product Documentation
- **[PRD.md](./prd.md)** - Product Requirements Document
  - Executive summary
  - User stories and workflows
  - Functional & non-functional requirements
  - Business rules overview

### Architecture & Design
- **[technical_architecture.md](./technical_architecture.md)** - System Architecture
  - Technology stack
  - Component architecture
  - Deployment architecture
  - Security design

### Developer Guides
- **[GIT_WORKFLOW.md](./GIT_WORKFLOW.md)** - Git Branching & Workflow
  - Branch naming conventions
  - Commit message guidelines
  - Pull request process
  
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing Standards
  - Unit testing guidelines
  - Integration testing approach
  - E2E testing setup
  
- **[DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)** - Database Migrations
  - Prisma migration workflow
  - Migration best practices
  - Rollback procedures

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common Issues
  - Development environment issues
  - Deployment problems
  - Quick fixes

---

## 🔗 Related Documentation

### Backend Documentation
Location: `documents/02-backend/`
- **BUSINESS_RULES.md** - Detailed business logic rules ⭐
- **API_CONTRACT.md** - API endpoint specifications
- **DEVELOPMENT_GUIDE.md** - Backend implementation patterns

### Frontend Documentation
Location: `documents/03-frontend/`
- **UI_UX_GUIDE.md** - UI/UX standards
- **COMPONENT_LIBRARY.md** - Reusable components

### Implementation Details
Location: `backend/` and `frontend/`
- **backend/prisma/schema.prisma** - Database schema ⭐
- **backend/README.md** - Backend setup
- **frontend/README.md** - Frontend setup

---

## 📝 Quick Links

### For Business Stakeholders
1. Start with **[PRD.md](./prd.md)** - Understanding requirements
2. Review **[../02-backend/BUSINESS_RULES.md](../02-backend/BUSINESS_RULES.md)** - Business logic

### For Developers
1. **[technical_architecture.md](./technical_architecture.md)** - System overview
2. **[GIT_WORKFLOW.md](./GIT_WORKFLOW.md)** - Development workflow
3. **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing approach
4. **[../02-backend/BUSINESS_RULES.md](../02-backend/BUSINESS_RULES.md)** - Implementation rules ⭐

### For DevOps
1. **[technical_architecture.md](./technical_architecture.md)** - Deployment architecture
2. **[DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)** - Database operations
3. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues

---

## 📦 Archived Documentation

**Location**: `documents/99-archive/2026-02-04-pre-toggle-update/`

Files archived before business rules update:
- `api_specification.md` - Superseded by API_CONTRACT.md
- `database_schema.md` - Superseded by Prisma schema

---

## 🔄 Recent Updates

**2026-02-06**: Business Rules Round 2 - Major Updates ⭐ NEW
- ✅ **One team per mahasiswa** (changed from 2)
- ✅ **Dosen pembimbing** optional at creation, required at upload
- ✅ **Proposal editing** capability when status = needs_revision
- ✅ **Administratif display** simplified to error count only
- ✅ **Substantif bobot** changed to simple multiplication
- ✅ **Admin permissions** - delete teams anytime, create reviewers directly
- ✅ **Dashboard UX** - conditional landing for mahasiswa
- ✅ **No edit role** feature (removed)
- See: `brain/business_rule_changes_round2.md` for details

**2026-02-04**: Business Rules Round 1 - Initial Updates
- ✅ Auto-exclusive toggle mechanism implemented
- ✅ New proposal status flow (7 statuses)
- ✅ Separated scoring system (no total score)
- ✅ Flexible reviewer assignment
- See: `brain/confirmed_changes_master.md` for details

---

## 📋 Document Status

| Document | Status | Last Updated | Notes |
|----------|--------|--------------|-------|
| **page_structure.md** | ✅ Current | 2026-02-06 | Updated with all business rules ⭐ |
| **BUSINESS_RULES.md** | ✅ Current | 2026-02-06 | Round 2 changes applied ⭐ |
| **backend/prisma/schema.prisma** | ✅ Current | 2026-02-06 | DB constraints updated ⭐ |
| prd.md | ⏳ Needs Update | 2026-02-02 | Missing round 1 & 2 changes |
| technical_architecture.md | ✅ Current | 2026-02-03 | Up to date |
| GIT_WORKFLOW.md | ✅ Current | 2026-01-30 | - |
| TESTING_GUIDE.md | ✅ Current | 2026-01-30 | - |
| DATABASE_MIGRATIONS.md | ⚠️ Review Needed | 2026-02-01 | May need migration notes |
| TROUBLESHOOTING.md | ✅ Current | 2026-02-01 | - |

---

## 💡 Contributing to Documentation

### When to Update
- New feature added
- Business rule changed
- Architecture modified
- Breaking change introduced

### How to Update
1. Update relevant document(s)
2. Update "Last Updated" date
3. Note significant changes in commit message
4. Update this README if file structure changes

---

**For detailed business rules and toggle mechanism, see**: `documents/02-backend/BUSINESS_RULES.md` ⭐
