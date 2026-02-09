# Strategi Implementasi Backend PKM Review

> **Last Updated**: 2026-02-08 (synced with wireframes & PRD)

## Overview
Implementasi bertahap dengan 4 fase, mempertimbangkan dependensi antar fitur.

---

## Fase 1: Foundation (Week 1-2)
**Goal**: Setup dasar dan autentikasi

### 1.1 Project Setup
- [ ] Struktur folder NestJS modules
- [ ] Prisma service configuration
- [ ] Supabase Auth integration
- [ ] JWT Guard implementation
- [ ] Environment configuration

### 1.2 Master Data Module
**Files**: `src/master-data/`
- [ ] `jenis-pkm.controller.ts` - CRUD jenis PKM
- [ ] `jurusan.controller.ts` - CRUD jurusan
- [ ] `program-studi.controller.ts` - CRUD program studi
- [ ] Services dengan validasi unique constraints

### 1.3 Authentication Module  
**Files**: `src/auth/`
- [ ] `auth.controller.ts` - Register, login, logout
- [ ] `auth.service.ts` - Supabase Auth integration
- [ ] `jwt.strategy.ts` - JWT validation
- [ ] `roles.guard.ts` - Role-based access

**Dependencies**: Master Data (untuk registrasi mahasiswa)

---

## Fase 2: Core Features (Week 3-4)
**Goal**: Team dan Proposal management + Browse/Join

### 2.1 Mahasiswa Module
**Files**: `src/mahasiswa/`
- [ ] `mahasiswa.controller.ts` - Profile, list
- [ ] `mahasiswa.service.ts` - CRUD operations
- [ ] Dashboard conditional logic (has team vs no team)

### 2.2 Team Module
**Files**: `src/teams/`
- [ ] `teams.controller.ts`
  - POST /teams - Create (auto-create 2 proposals)
  - GET /teams/:id - Detail dengan members
  - PUT /teams/:id - Update detail
  - DELETE /teams/:id - Delete (cascade with confirmation count)
  - GET /teams/browse - Browse open teams ⭐ NEW
- [ ] `team-members.controller.ts`
  - POST /teams/:id/members - Join/invite
  - DELETE /teams/:id/members/:id - Kick/leave
  - PUT /teams/:id/members/:id/role - Ubah role
- [ ] `join-requests.controller.ts` ⭐ NEW
  - POST /teams/:id/join-requests - Send request
  - GET /teams/:id/join-requests - List pending (always visible)
  - PUT /teams/:id/join-requests/:id/approve - Approve
  - PUT /teams/:id/join-requests/:id/reject - Reject
- [ ] `teams.service.ts`
  - Validasi one team per mahasiswa ⭐ CRITICAL
  - Validasi min/max members (3-5)
  - Auto-delete jika 0 members
  - Open to join toggle logic

**Browse Teams Logic** ⭐ NEW:
```typescript
// Visible teams criteria
const openTeams = await prisma.team.findMany({
  where: {
    status: 'active',
    openToJoin: true,
    proposals: { some: { status: 'draft' } },
    _count: { teamMembers: { lt: 5 } }
  }
});
```

### 2.3 Dosen Pembimbing Module
**Files**: `src/dosen-pembimbing/`
- [ ] `dosen-pembimbing.controller.ts`
- [ ] Logic: create jika nama tidak ada, reuse jika ada
- [ ] REQUIRED validation before upload proposal

### 2.4 Proposal Module
**Files**: `src/proposals/`
- [ ] `proposals.controller.ts`
  - GET /proposals/:id - Detail proposal
  - GET /proposals/team/:teamId - List by team
- [ ] `proposal-files.controller.ts`
  - POST /proposals/:id/upload - Upload PDF (check toggle)
  - GET /proposals/:id/download - Download file
- [ ] `proposals.service.ts`
  - Validasi: team >= 3 members, dosen WAJIB
  - Validasi file: PDF only, max 10MB
  - Status transition: draft → submitted
  - Check toggle state before upload

**Dependencies**: Fase 1, Team Module

---

## Fase 3: Review System (Week 5-6)
**Goal**: Assignment, Assessment, dan Blind Review

### 3.1 Reviewer Module
**Files**: `src/reviewers/`
- [ ] `reviewers.controller.ts`
  - POST /admin/reviewers - Create directly (one-step) ⭐ NEW
  - GET /reviewers/:id - Detail with stats ⭐ NEW
  - PUT /reviewers/:id - Update
  - DELETE /reviewers/:id - Delete (SET NULL) ⭐ NEW
- [ ] `reviewers.service.ts`
  - One-step creation (user + profile in transaction)
  - Statistics calculation (assigned, completed, pending)

### 3.2 Reviewer Assignment Module
**Files**: `src/reviewer-assignments/`
- [ ] `reviewer-assignments.controller.ts`
  - POST /admin/assignments - Assign 2 reviewers
  - POST /admin/assignments/bulk - Bulk assign ⭐ NEW
  - GET /reviewers/my-assignments - List assigned
  - DELETE /admin/assignments/:id - Unassign (if reviewEnabled)
- [ ] `assignments.service.ts`
  - Validasi: exactly 2 reviewers, tidak sama
  - Flexible assignment (during review phase OK)
  - Lock after toggle OFF

### 3.3 Penilaian Administrasi Module
**Files**: `src/penilaian-administrasi/`
- [ ] `penilaian-administrasi.controller.ts`
  - POST /reviews/:id/administrasi - Submit checklist
  - PUT /reviews/:id/administrasi - Update (if reviewEnabled)
  - GET /reviews/:id/administrasi - Get (blind review enforced)
- [ ] Checklist validation per jenis PKM
- [ ] Error count calculation
- [ ] Return error details for mahasiswa view ⭐ NEW

### 3.4 Penilaian Substansi Module
**Files**: `src/penilaian-substansi/`
- [ ] `penilaian-substansi.controller.ts`
  - POST /reviews/:id/substansi - Submit skor
  - PUT /reviews/:id/substansi - Update (if reviewEnabled)
  - GET /reviews/:id/substansi - Get (blind review enforced)
- [ ] Skor validation (min 1, max 7 typically) ⭐ UPDATED
- [ ] Nilai = skor × bobot calculation ⭐ UPDATED
- [ ] Total nilai = SUM(all nilai)
- [ ] NO combined total score

**Substantif Scoring** ⭐ UPDATED:
```typescript
// Score scale: 1-7 (4 skipped)
// 1=Buruk, 2=Sangat kurang, 3=Kurang, 5=Cukup, 6=Baik, 7=Sangat baik
const nilai = skor * bobot;  // e.g., 6 × 15 = 90
const totalNilai = sum(allNilai);  // e.g., 625
```

### 3.5 PDF Annotation Module
**Files**: `src/pdf-annotations/`
- [ ] `pdf-annotations.controller.ts`
  - POST /annotations - Create highlight/comment
  - GET /annotations/:fileId - List by file (filtered by reviewer)
  - DELETE /annotations/:id - Delete (if reviewEnabled)
- [ ] JSONB data handling (coordinates, color, reviewer_number)
- [ ] Blind review: only show own annotations during review

**Dependencies**: Fase 2, Kriteria must exist

---

## Fase 4: Admin & Configuration (Week 7-8)
**Goal**: Admin tools, toggles, dan dashboard

### 4.1 Kriteria Management Module
**Files**: `src/kriteria/`
- [ ] `kriteria-administrasi.controller.ts` - CRUD checklist items
- [ ] `kriteria-substansi.controller.ts` - CRUD indikator + bobot + skor range
- [ ] Dynamic per jenis PKM
- [ ] **Bobot validation: total MUST = 100** ⭐ CRITICAL

**Bobot Validation** ⭐ NEW:
```typescript
async validateBobotTotal(jenisPkmId: number, newBobot: number, excludeId?: number) {
  const existing = await prisma.kriteriaSubstansi.findMany({
    where: { jenisPkmId, id: excludeId ? { not: excludeId } : undefined }
  });
  const currentTotal = existing.reduce((sum, k) => sum + k.bobot, 0);
  
  if (currentTotal + newBobot !== 100) {
    throw new BadRequestException(`Total bobot harus 100. Saat ini: ${currentTotal + newBobot}`);
  }
}
```

### 4.2 System Config Module
**Files**: `src/system-config/`
- [ ] `system-config.controller.ts`
  - GET /config - Get all toggles
  - PUT /config/:key - Update toggle (auto-exclusive)
- [ ] `config.service.ts`
  - Toggle uploadProposalEnabled
  - Toggle reviewEnabled (+ auto status transitions)
  - Toggle uploadRevisionEnabled (+ auto status transitions)
  - **Auto-exclusive enforcement** ⭐ CRITICAL

**Toggle Side Effects** ⭐ NEW:
```typescript
async updateToggle(name: string, value: boolean, adminId: string) {
  await prisma.$transaction(async (tx) => {
    // 1. Auto-exclusive: turn OFF others if turning ON
    if (value === true) {
      await tx.systemSettings.updateMany({
        where: { fieldName: { in: toggleNames } },
        data: { fieldValue: 'false' }
      });
    }
    
    // 2. Update target toggle
    await tx.systemSettings.update({ ... });
    
    // 3. Execute side effects
    if (name === 'reviewEnabled' && value === true) {
      // submitted → under_review
      await tx.proposal.updateMany({
        where: { status: 'submitted' },
        data: { status: 'under_review' }
      });
    }
    
    if (name === 'reviewEnabled' && value === false) {
      // under_review → reviewed/not_reviewed based on review count
      await finalizeReviews(tx);
    }
    
    if (name === 'uploadRevisionEnabled' && value === true) {
      // reviewed → needs_revision
      await tx.proposal.updateMany({
        where: { status: 'reviewed' },
        data: { status: 'needs_revision' }
      });
    }
    
    // 4. Audit log
    await tx.auditLog.create({ ... });
  });
}
```

### 4.3 Dashboard Module
**Files**: `src/dashboard/`
- [ ] `dashboard.controller.ts`
  - GET /dashboard/admin - Stats + phase detection ⭐ UPDATED
  - GET /dashboard/reviewer - My progress + stats
  - GET /dashboard/mahasiswa - My team or browse options ⭐ UPDATED

**Admin Dashboard Data** ⭐ NEW:
```typescript
{
  currentPhase: 'SUBMISSION' | 'REVIEW' | 'REVISION' | 'CLOSED',
  toggleStates: { uploadProposal: true, review: false, revision: false },
  stats: {
    totalUsers: 234,
    totalTeams: 45,
    proposalsSubmitted: 38,
    activeReviewers: 12
  },
  proposalsByStatus: {
    draft: { count: 12, percentage: 31.6 },
    submitted: { count: 18, percentage: 47.4 },
    // ... all 7 statuses
  }
}
```

**Mahasiswa Dashboard Data** ⭐ NEW:
```typescript
// Conditional response based on team membership
if (hasTeam) {
  return { layout: 'TEAM_DASHBOARD', team: {...}, proposalStatus: '...' };
} else {
  return { layout: 'NO_TEAM', openTeamsPreview: [...] };
}
```

### 4.4 User Management Module ⭐ NEW
**Files**: `src/users/`
- [ ] `users.controller.ts`
  - GET /admin/users - List all users
  - PUT /admin/users/:id/activate - Activate
  - PUT /admin/users/:id/deactivate - Deactivate
  - DELETE /admin/users/:id - Delete (SET NULL foreign keys)
- [ ] NO edit role feature

### 4.5 Proposal Template Module (Optional)
**Files**: `src/templates/`
- [ ] Template upload/download per jenis PKM

**Dependencies**: Fase 3

---

## Module Structure

```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── roles.guard.ts
├── master-data/
│   ├── jenis-pkm.controller.ts
│   ├── jurusan.controller.ts
│   └── program-studi.controller.ts
├── mahasiswa/
│   ├── mahasiswa.controller.ts
│   └── mahasiswa.service.ts
├── teams/
│   ├── teams.controller.ts
│   ├── teams.service.ts
│   ├── team-members.controller.ts
│   ├── join-requests.controller.ts       ⭐ NEW
│   └── dto/
├── dosen-pembimbing/
│   ├── dosen-pembimbing.controller.ts
│   └── dosen-pembimbing.service.ts
├── proposals/
│   ├── proposals.controller.ts
│   ├── proposals.service.ts
│   └── proposal-files.controller.ts
├── reviewers/
│   ├── reviewers.controller.ts
│   └── reviewers.service.ts
├── reviewer-assignments/
│   ├── reviewer-assignments.controller.ts
│   └── assignments.service.ts
├── penilaian-administrasi/
│   ├── penilaian-administrasi.controller.ts
│   └── administrasi.service.ts
├── penilaian-substansi/
│   ├── penilaian-substansi.controller.ts
│   └── substansi.service.ts
├── pdf-annotations/
│   ├── pdf-annotations.controller.ts
│   └── annotations.service.ts
├── kriteria/
│   ├── kriteria-administrasi.controller.ts
│   └── kriteria-substansi.controller.ts
├── system-config/
│   ├── system-config.controller.ts
│   └── config.service.ts
├── dashboard/
│   └── dashboard.controller.ts
├── users/                                  ⭐ NEW
│   ├── users.controller.ts
│   └── users.service.ts
└── prisma/
    └── prisma.service.ts
```

---

## Critical Implementation Notes

### 1. One Team Per Mahasiswa ⭐ CRITICAL
```typescript
// Before creating team or accepting join request
const existingMembership = await prisma.teamMember.findFirst({
  where: { mahasiswaId, team: { status: 'active' } }
});

if (existingMembership) {
  throw new ConflictException('Mahasiswa sudah terdaftar di tim lain');
}
```

### 2. Dual Proposal Handling
```typescript
// Saat create team, auto-create 2 proposals
await this.prisma.$transaction(async (tx) => {
  const team = await tx.team.create({ data });
  await tx.proposal.createMany({
    data: [
      { teamId: team.id, type: 'original', status: 'draft' },
      { teamId: team.id, type: 'revised', status: 'draft' }
    ]
  });
});
```

### 3. Dosen Pembimbing Required for Upload
```typescript
async uploadProposal(teamId: number, file: File) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  
  if (!team.dosenPembimbingId) {
    throw new BadRequestException(
      'Dosen pembimbing wajib diisi sebelum upload proposal'
    );
  }
  
  // Check toggle
  const uploadEnabled = await getSettingValue('uploadProposalEnabled');
  if (!uploadEnabled) {
    throw new ForbiddenException('Upload proposal sedang ditutup');
  }
  
  // Proceed with upload...
}
```

### 4. Blind Review Enforcement
```typescript
// When fetching reviews - only own review
const review = await prisma.review.findFirst({
  where: {
    proposalId,
    reviewerId: currentUser.reviewerId  // ONLY their own
  }
});

// ❌ NEVER expose other reviewer's data
```

### 5. Score Calculation (Separated)
```typescript
// Substansi: rata-rata dari 2 reviewer (SEPARATED from administratif)
const avgSubstantif = (r1.totalSubstantif + r2.totalSubstantif) / 2;
const avgAdministratif = (r1.totalAdministratif + r2.totalAdministratif) / 2;

// ❌ NO combined total score
// Store: administratifScore, substantifScore (separate fields)
```

### 6. Administrasi: Error Union
```typescript
// Jika SALAH SATU reviewer centang error = tampilkan sebagai error
const allErrors = new Set([...r1Errors, ...r2Errors]);
```

### 7. Delete with SET NULL
```typescript
// When deleting mahasiswa/reviewer
await prisma.teamMember.updateMany({
  where: { mahasiswaId: userId },
  data: { mahasiswaId: null }  // SET NULL, keep record
});
await prisma.user.delete({ where: { id: userId } });

// UI shows "[User Deleted]" for null references
```

### 8. Toggle Auto-Exclusive
```typescript
// Only ONE toggle can be ON at a time
async function setToggle(name: string, value: boolean) {
  if (value === true) {
    // Turn OFF all others first
    await prisma.systemSettings.updateMany({
      where: { fieldName: { not: name } },
      data: { fieldValue: 'false' }
    });
  }
  // Then update target
}
```

---

## Authorization Pattern

```typescript
@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  @Post()
  @Roles('mahasiswa')
  async create(@Req() req, @Body() dto: CreateTeamDto) {
    // Check one team per mahasiswa
    const existing = await this.teamsService.findByMahasiswa(req.user.mahasiswaId);
    if (existing) throw new ConflictException('Already in a team');
    // ...
  }
  
  @Get('browse')
  @Roles('mahasiswa')
  async browseOpenTeams() {
    // Only show open teams
  }
  
  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string) {
    // Cascade count for confirmation
    const impact = await this.teamsService.getCascadeImpact(id);
    return { impact, teamId: id };
  }
}
```

---

## Testing Strategy

### Unit Tests
- Service layer business logic
- Validation functions (bobot = 100, one team per mahasiswa)
- Score calculations (nilai = skor × bobot)
- Toggle auto-exclusive logic

### Integration Tests
- API endpoints dengan supertest
- Database transactions
- File upload flow
- Toggle side effects

### E2E Tests
Critical user flows:
1. Register → Create Team → Upload Proposal
2. Browse Teams → Join Request → Approve
3. Admin Assign → Reviewer Submit Review (blind)
4. Toggle Review OFF → Lihat hasil (separated scores)
5. Toggle Revision ON → Upload revisi

---

## Implementation Checklist per Feature

### Before Coding
- [ ] Review PRD requirements
- [ ] Check API contract
- [ ] Check BUSINESS_RULES.md
- [ ] Define DTOs dengan validation

### During Coding
- [ ] Authorization checks
- [ ] Business rules enforcement
- [ ] Toggle state checks
- [ ] Error handling dengan proper exceptions
- [ ] Transaction untuk multi-step operations

### After Coding
- [ ] Unit tests
- [ ] API documentation (Swagger)
- [ ] Integration tests
- [ ] Update dev journal
