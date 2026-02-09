# Business Rules Reference
## PKM Review Application

> **Critical**: These rules MUST be enforced in code. Violating these rules breaks the application logic.
> **Last Updated**: 2026-02-08 (synced with wireframes & PRD)

---

## 🎛️ System Toggle Configuration

### Rule: Three Auto-Exclusive Toggles
System has **3 global toggles** stored in `system_settings` table (key-value):

1. **uploadProposalEnabled** (default: `true`)
2. **reviewEnabled** (default: `false`)
3. **uploadRevisionEnabled** (default: `false`)

**CRITICAL**: Toggles are **AUTO-EXCLUSIVE** - only ONE can be ON at a time.

**Database Structure:**
```prisma
model SystemSettings {
  fieldName  String @unique  // e.g., "uploadProposalEnabled"
  fieldValue String          // "true" or "false"
}
```

**Auto-Exclusive Enforcement:**
```typescript
async function updateToggle(toggleName: string, newValue: boolean) {
  if (newValue === true) {
    // Turning ON one toggle = auto turn OFF others
    await prisma.$transaction([
      // Turn OFF all toggles first
      prisma.systemSettings.updateMany({
        where: { 
          fieldName: { in: ['uploadProposalEnabled', 'reviewEnabled', 'uploadRevisionEnabled'] }
        },
        data: { fieldValue: 'false' }
      }),
      
      // Turn ON the requested toggle
      prisma.systemSettings.update({
        where: { fieldName: toggleName },
        data: { fieldValue: 'true' }
      })
    ]);
  } else {
    // Turning OFF = just turn OFF (all toggles OFF is valid)
    await prisma.systemSettings.update({
      where: { fieldName: toggleName },
      data: { fieldValue: 'false' }
    });
  }
}

// Check if toggle is ON
const setting = await prisma.systemSettings.findUnique({
  where: { fieldName: 'uploadProposalEnabled' }
});
const isEnabled = setting?.fieldValue === 'true';
```

---

### Rule: Toggle - Upload Proposal
Controls mahasiswa ability to upload and submit proposals.

**When ON (`true`)**:
- Mahasiswa can upload proposal files
- Mahasiswa can submit proposals (draft → submitted)

**When OFF (`false`)**:
- ❌ Mahasiswa CANNOT upload files
- ❌ Mahasiswa CANNOT submit proposals

**Enforcement:**
```typescript
const uploadEnabled = await getSettingValue('uploadProposalEnabled');
if (!uploadEnabled) {
  throw new ForbiddenException('Proposal upload is currently disabled');
}
```

---

### Rule: Toggle - Review
Controls review process and automatic status transitions.

**When Toggled ON**:
- ALL proposals with status `submitted` → `under_review` **automatically**
- Reviewers can submit new reviews
- Reviewers can edit existing reviews

**When Toggled OFF**:
- ALL proposals with status `under_review`:
  - → `reviewed` (if has ≥1 review)
  - → `not_reviewed` (if has 0 reviews)
- ❌ Reviewers CANNOT submit new reviews
- ❌ Reviewers CANNOT edit existing reviews
- Reviews become FINAL/LOCKED

**Enforcement:**
```typescript
// On toggle OFF
async function finalizeReviews() {
  const proposals = await prisma.proposal.findMany({
    where: { status: 'under_review' },
    include: { reviewerAssignments: { include: { penilaianSubstansi: true } } }
  });

  for (const proposal of proposals) {
    const reviewCount = proposal.reviewerAssignments.filter(
      ra => ra.penilaianSubstansi?.isComplete
    ).length;

    const newStatus = reviewCount >= 1 ? 'reviewed' : 'not_reviewed';
    
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: newStatus }
    });
  }
}
```

---

### Rule: Toggle - Upload Revision
Controls mahasiswa ability to upload revised proposals.

**When Toggled ON**:
- ALL proposals with status `reviewed` → `needs_revision` **automatically**
- Mahasiswa can upload revision files
- Can upload multiple times while toggle is ON
- Each upload: status changes to `revised`

**When Toggled OFF**:
- ❌ Mahasiswa CANNOT upload revision files
- Proposals remain in current status:
  - `needs_revision` stays `needs_revision`
  - `revised` stays `revised`

**Enforcement:**
```typescript
// On toggle ON
async function enableRevisions() {
  await prisma.proposal.updateMany({
    where: { status: 'reviewed' },
    data: { status: 'needs_revision' }
  });
}

// On file upload
const revisionEnabled = await getSettingValue('uploadRevisionEnabled');
if (!revisionEnabled) {
  throw new ForbiddenException('Revision upload is currently disabled');
}
```

---

## 📄 Proposal Status Flow

### Rule: Status Enum
```typescript
enum ProposalStatus {
  draft           // Initial state when team created
  submitted       // After file upload
  under_review    // When review toggle ON
  reviewed        // When review toggle OFF (has reviews)
  not_reviewed    // When review toggle OFF (no reviews)
  needs_revision  // When upload revision toggle ON
  revised         // After revision file uploaded
}
```

**Removed statuses:** ~~approved~~, ~~rejected~~, ~~sudah_di_revisi~~

---

### Rule: Status Transitions

**Valid transitions controlled by admin toggles:**

```typescript
// AUTOMATIC transitions (triggered by toggles)
const automaticTransitions = {
  'submitted': 'under_review',       // Toggle ON: review
  'under_review': 'reviewed',        // Toggle OFF: review (has reviews)
  'under_review': 'not_reviewed',    // Toggle OFF: review (no reviews)
  'reviewed': 'needs_revision',      // Toggle ON: upload revision
};

// MANUAL transitions (mahasiswa actions)
const manualTransitions = {
  'draft': 'submitted',              // Upload & submit file
  'needs_revision': 'revised',       // Upload revision file
};
```

**Enforcement:**
```typescript
if (!isValidTransition(currentStatus, newStatus)) {
  throw new BadRequestException(
    `Invalid status transition: ${currentStatus} → ${newStatus}`
  );
}
```

---

### Rule: Unlimited Revision Cycles
- Revision cycles are **unlimited**
- Each cycle controlled by admin toggles
- Flow: `reviewed` → `needs_revision` → `revised` → (toggle review ON) → `under_review` → `reviewed` → ...

**Example:**
```
Cycle 1: reviewed → needs_revision → revised
Cycle 2: (toggle review ON) → under_review → reviewed → needs_revision → revised
Cycle 3: (toggle review ON) → under_review → reviewed → ...
```

---

## 👥 User & Role Management

### Rule: User Role Assignment
- **Mahasiswa**: Created via registration, linked to `mahasiswa` table
- **Reviewer**: Created by admin DIRECTLY, linked to `reviewer_user` table  
- **Admin**: Created manually (seeded), no linked profile table

**Important**: NO EDIT ROLE feature - users have fixed roles since creation.

**Enforcement:** 
```typescript
if (user.role === 'mahasiswa' && !user.mahasiswaId) {
  throw new Error('Mahasiswa user must have linked mahasiswa profile');
}
```

---

### Rule: Email Uniqueness
- **Constraint**: Email must be unique across all users
- **Scope**: System-wide

**Enforcement:** Database unique constraint + validation

---

## 👨‍👩‍👦 Team Management

### Rule: Team Size Limits
- **Minimum**: 3 members to submit proposal
- **Maximum**: 5 members

**Enforcement:**
```typescript
const memberCount = team.teamMembers.length;
if (memberCount < 3) {
  throw new BadRequestException('Team must have at least 3 members to submit');
}
if (memberCount > 5) {
  throw new BadRequestException('Team cannot exceed 5 members');
}
```

---

### Rule: Equal Permissions for All Members
- ALL team members have **identical permissions**
- Ketua is just a **label**, not a privilege
- Any member can:
  - Edit team details
  - Upload proposal
  - Submit proposal
  - Kick other members
  - Change member roles (including own role)
  - Approve/reject join requests

**Enforcement:**
```typescript
// No special checks for ketua - all members can perform all actions
const membership = await prisma.teamMember.findFirst({
  where: { teamId, mahasiswaId: currentUser.mahasiswaId }
});

if (!membership) {
  throw new ForbiddenException('Not a team member');
}
// No role check needed - all members equal
```

---

### Rule: One Team Per Mahasiswa ⭐ CRITICAL
**Each mahasiswa can only be a member of ONE active team at a time.**

**Database Enforcement:**
```prisma
model TeamMember {
  // ... fields
  @@unique([mahasiswaId], name: "one_team_per_mahasiswa")
}
```

**Application Logic:**
```typescript
// Before creating team or accepting join request
const existingMembership = await prisma.teamMember.findFirst({
  where: {
    mahasiswaId,
    team: { status: 'active' }
  }
});

if (existingMembership) {
  throw new ConflictException('Mahasiswa is already in a team');
}
```

**Important**: Database constraint will automatically enforce this at DB level.

---

### Rule: Dosen Pembimbing - Optional Create, Required Upload
**Dosen pembimbing is optional when creating team, but REQUIRED before uploading proposal.**

**Team Creation** (Optional):
```typescript
async createTeam(data: CreateTeamDto) {
  return prisma.team.create({
    data: {
      ...data,
      dosenPembimbingId: data.dosenPembimbingId || null  // Nullable
    }
  });
}
```

**Proposal Upload** (Required):
```typescript
async uploadProposal(teamId: number, file: File) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  
  if (!team.dosenPembimbingId) {
    throw new BadRequestException(
      'Dosen pembimbing must be assigned before uploading proposal'
    );
  }
  
  // Proceed with upload
}
```

**UI Guidance**:
- Form create team: Mark dosen pembimbing as optional
- Upload proposal page: Show error if dosen pembimbing not assigned
- Team detail: Show warning if dosen pembimbing is null

---

### Rule: Open to Join Toggle ⭐ NEW
**Teams have an "Open to Join" flag that controls visibility in Browse Teams.**

**Database:**
```prisma
model Team {
  openToJoin Boolean @default(true)
}
```

**Browse Teams Visibility** (visible when ALL conditions met):
- `team.status = 'active'`
- `team.openToJoin = true`
- `memberCount < 5` (has space)
- `proposal.status = 'draft'` (not yet submitted)

**Enforcement:**
```typescript
// In list teams for browse
const openTeams = await prisma.team.findMany({
  where: {
    status: 'active',
    openToJoin: true,
    proposals: { some: { status: 'draft' } },
    teamMembers: { _count: { lt: 5 } }
  }
});
```

---

### Rule: Join Requests Always Visible ⭐ NEW
**Join requests are always visible to team members, even when team is full.**

**Display Logic:**
```typescript
// Always show join requests
// If team is full: Show "Tim Penuh (5/5)" message with disabled approve button
// Reject button still works (admin/members can reject pending requests)
```

---

## 👨‍🏫 Reviewer Assignment

### Rule: Two Reviewers Per Proposal
- Each proposal **should have** 2 reviewers
- Admin assigns manually or bulk
- Same reviewer cannot be assigned twice

**Enforcement:**
```typescript
if (reviewerIds.length !== 2) {
  throw new BadRequestException('Must assign exactly 2 reviewers');
}

if (reviewerIds[0] === reviewerIds[1]) {
  throw new BadRequestException('Cannot assign same reviewer twice');
}
```

---

### Rule: Flexible Reviewer Assignment
- Admin can assign reviewers **BEFORE or DURING** review phase
- Reviewers can be assigned **after** toggle ON review (flexible workflow)
- **After** toggle OFF review: ❌ Cannot reassign (reviews are locked)

**Enforcement:**
```typescript
// Can assign during review phase
const reviewEnabled = await getSettingValue('reviewEnabled');

if (reviewEnabled) {
  // ✅ OK to assign reviewers
  // Proposals can be under_review without reviewers (temporarily)
  // After assignment, reviewers can immediately start reviewing
  await assignReviewers(proposalId, reviewerIds);
} else {
  // ❌ Cannot assign after review phase ended
  throw new ForbiddenException('Cannot assign reviewers after review period ended');
}
```

**Workflow:**
```typescript
// Flexible approach (NEW):
// 1. Toggle ON review (submitted → under_review)
// 2. Admin assigns reviewers (can do anytime while toggle ON)
// 3. Reviewers start reviewing
// 4. Toggle OFF review (finalize)

// OR traditional approach (still valid):
// 1. Admin assigns reviewers to submitted proposals
// 2. Toggle ON review (submitted → under_review)
// 3. Reviewers start reviewing
// 4. Toggle OFF review (finalize)
```

---

### Rule: Blind Review ⭐ IMPORTANT
**Reviewers CANNOT see reviews from other reviewers on the same proposal.**

**Enforcement:**
```typescript
// When fetching reviews for reviewer view
const review = await prisma.review.findFirst({
  where: {
    proposalId,
    reviewerId: currentUser.reviewerId  // Only their own review
  }
});

// ❌ Never allow: findMany with other reviewers' data
```

---

## ⭐ Review Scoring (SEPARATED)

### Rule: NO Total Score
- **CRITICAL**: System does **NOT** calculate or store total score
- Only store **administratif** and **substantif** scores **separately**

**Removed calculation:**
```typescript
// ❌ OLD (REMOVED):
const totalScore = (administratifScore * 0.3) + (substantifScore * 0.7);

// ✅ NEW:
// Store both scores separately, NO total
```

---

### Rule: Score Calculation with 2 Reviewers
When both reviewers submit:

```typescript
// Get both reviews
const review1 = await getReview(proposalId, reviewer1Id);
const review2 = await getReview(proposalId, reviewer2Id);

// Calculate averages (SEPARATED)
const avgAdministratif = (review1.totalAdministratif + review2.totalAdministratif) / 2;
const avgSubstantif = (review1.totalSubstantif + review2.totalSubstantif) / 2;

// Store in proposal
await prisma.proposal.update({
  where: { id: proposalId },
  data: {
    administratifScore: avgAdministratif,
    substantifScore: avgSubstantif
    // NO totalScore field
  }
});
```

---

### Rule: Score Calculation with 1 Reviewer
If only 1 reviewer submits (by toggle OFF deadline):

```typescript
// Get single review
const review = await getReview(proposalId, reviewerId);

// Use direct scores (NO averaging)
await prisma.proposal.update({
  where: { id: proposalId },
  data: {
    administratifScore: review.totalAdministratif,
    substantifScore: review.totalSubstantif
    // NO totalScore
  }
});
```

---

### Rule: Score Display
Mahasiswa sees **both scores separately**:

```typescript
{
  "administratif": 87.5,  // Out of 100
  "substantif": 80.0,     // Out of 100
  // NO "total" field
}
```

---

### Rule: Administratif Display - Error Count + Details ⭐ UPDATED
**For mahasiswa view, show error count AND list of specific criteria that have errors.**

**Mahasiswa Display**:
```tsx
<div>
  <label>Penilaian Administratif</label>
  <div>Jumlah Kesalahan: {totalKesalahan}</div>
  
  {/* Show list of errors */}
  <ul>
    {kesalahanList.map(error => (
      <li key={error.id}>
        <strong>{error.kriteriaNama}</strong>
        {error.catatan && <p>{error.catatan}</p>}
      </li>
    ))}
  </ul>
</div>
```

**Reviewer still sees** full checklist for input.

---

### Rule: Substantif Bobot - Simple Multiplication ⭐ IMPORTANT
**Bobot is a simple number (not percentage). Calculation: SUM(score × bobot).**

**Data Structure**:
```typescript
interface KriteriaSubstansi {
  bobot: number;  // Simple number (e.g., 3, 5, 10) - NOT percentage
}
```

**Calculation**:
```typescript
// For each criterion: nilai = skor × bobot
const totalSkor = criteria.reduce((sum, c) => {
  return sum + (c.skor * c.bobot);
}, 0);

// Example:
// Kreativitas: 85 × 3 = 255
// Kelayakan:   90 × 5 = 450
// Penyajian:   78 × 2 = 156
// Total: 255 + 450 +156 = 861
```

**Validation**:
- Bobot must be > 0
- **Total bobot per jenis PKM MUST = 100**
- Display WITHOUT % symbol (e.g., "15" not "15%")

---

### Rule: Substantif Score Scale ⭐ NEW
**Standard scoring scale for substantif criteria:**

| Skor | Meaning |
|------|---------|
| 1 | Buruk |
| 2 | Sangat kurang |
| 3 | Kurang |
| 5 | Cukup |
| 6 | Baik |
| 7 | Sangat baik |

**Note**: 4 is skipped in this scale (by design).

---

## 🔐 Admin Permissions

### Rule: Admin Can Delete Teams Anytime ⭐ CRITICAL
**Admin can delete teams regardless of proposal or review status.**

```typescript
// No status checks - can delete anytime
async deleteTeam(teamId: number) {
  return prisma.team.delete({
    where: { id: teamId }
    // Cascade deletes: members, proposals, reviews
  });
}
```

**Safety**: Strong confirmation UI required with cascade impact preview.

**Delete Confirmation Modal Requirements:**
```
PERINGATAN: Ini akan menghapus:
- Team beserta {X} anggota
- {Y} proposal
- {Z} review yang sudah dibuat

Aksi ini TIDAK BISA DIBATALKAN!

[Input field: Type "HAPUS" to confirm]
```

---

### Rule: Create Reviewer Directly ⭐ NEW
**Admin creates reviewer accounts in one step. No role editing.**

```typescript
async createReviewer(data: CreateReviewerDto) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        password: await hash(data.password),
        role: 'reviewer'  // Direct assignment
      }
    });
    
    const reviewer = await tx.reviewer.create({
      data: {
        userId: user.id,
        nama: data.nama,
        nidn: data.nidn,
        // ... other fields
      }
    });
    
    return { user, reviewer };
  });
}
```

**No "Edit Role" feature** - users have fixed roles.

---

### Rule: Admin User Deletion - Hard Delete with SET NULL ⭐ NEW
**Admin can delete users (mahasiswa/reviewer), but related data is preserved.**

**Mahasiswa Deletion:**
```typescript
async deleteMahasiswa(userId: number) {
  // 1. User deleted permanent
  // 2. Related data TETAP ADA (team, proposal, review tidak hilang)
  // 3. Foreign keys SET NULL (TeamMember.mahasiswaId → NULL)
  // 4. Display: Show "[User Deleted]" di UI untuk deleted users
}
```

**Reviewer Deletion:**
```typescript
async deleteReviewer(userId: number) {
  // 1. User deleted permanent
  // 2. Reviews TETAP ADA (review assignment, scores, checklist tidak hilang)
  // 3. Foreign keys SET NULL (ReviewAssignment.reviewerId → NULL)
  // 4. Display: Show "[Reviewer Deleted]" di UI
}
```

---

## 📁 File Management

### Rule: File Upload Constraints
- **Max size**: 10MB (10,485,760 bytes)
- **Allowed type**: `application/pdf` only
- **Naming**: `{teamId}_{timestamp}_{sanitized_filename}.pdf`

**Enforcement:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_FILE_SIZE) {
  throw new BadRequestException('File size exceeds 10MB limit');
}

if (file.mimetype !== 'application/pdf') {
  throw new BadRequestException('Only PDF files are allowed');
}
```

---

### Rule: Proposal Type System
- **original**: Initial submission (gets reviewed)
- **revised**: Revision files (documentation only, NOT reviewed)

**Key Rules:**
- 1 team = 2 proposals (original + revised)
- Only **original** gets reviews
- **revised** is for documentation only

---

## 🔒 Authorization Rules

### Rule: Data Access Boundaries

| Resource | Mahasiswa | Reviewer | Admin |
|----------|-----------|----------|-------|
| **Own Teams** | ✅ Full | ❌ None | ✅ Full |
| **Other Teams** | ❌ None | ❌ None | ✅ Full |
| **Own Proposals** | ✅ Read/Write | ❌ None | ✅ Full |
| **Assigned Proposals** | ❌ None | ✅ Read/Review | ✅ Full |
| **All Proposals** | ❌ None | ❌ None | ✅ Full |
| **Reviews** | ✅ Read (own proposals) | ✅ Read/Write (if reviewEnabled) | ✅ Full |

---

### Rule: Review Period Locking
- When `reviewEnabled` = `false`:
  - ❌ Reviewers cannot submit reviews
  - ❌ Reviewers cannot edit reviews
  - ✅ Reviews are read-only for everyone

```typescript
const reviewEnabled = await getSettingValue('reviewEnabled');
if (!reviewEnabled) {
  throw new ForbiddenException('Review period has ended');
}
```

---

## 🚫 Forbidden Operations

### Operations That MUST NOT Be Allowed

1. ❌ Submit review when `reviewEnabled` = false
2. ❌ Edit review when `reviewEnabled` = false
3. ❌ Upload proposal when `uploadProposalEnabled` = false
4. ❌ Upload revision when `uploadRevisionEnabled` = false
5. ❌ Reassign reviewers after toggle OFF review
6. ❌ Skip status transitions (must follow flow)
7. ❌ Calculate or store total score (use separated scores only)
8. ❌ Accept late reviews after toggle OFF
9. ❌ Edit user roles after creation

---

## 🔄 Special Rules

### Rule: Single Reviewer Scenario
When only 1 of 2 reviewers submits before toggle OFF:

**Behavior:**
```typescript
// On toggle OFF review
if (reviewCount === 1) {
  // ✅ Accept single review
  proposal.status = 'reviewed';  // Not 'not_reviewed'
  proposal.administratifScore = review1.totalAdministratif;
  proposal.substantifScore = review1.totalSubstantif;
  // No averaging, use single review directly
}
```

**NO reminders** sent to inactive reviewer.

---

### Rule: Late Review Rejection
After toggle OFF review:

```typescript
const reviewEnabled = await getSettingValue('reviewEnabled');
if (!reviewEnabled) {
  throw new ForbiddenException('Review period has ended. Late reviews not accepted.');
}
```

---

### Rule: Revision Without New Review
- When mahasiswa uploads revision (`revised` status)
- File stays as `revised` until admin toggles ON review again
- **No automatic transition** to `under_review`

```typescript
// Uploading revision does NOT trigger review
// Admin must manually toggle ON review for new cycle
await uploadRevision(); // Status: needs_revision → revised
// Status stays 'revised' until admin toggle
```

---

## 🛡️ Data Integrity

### Soft Delete Rules
- Use `deletedAt` timestamp for soft deletes
- Never hard delete:
  - Users
  - Teams
  - Proposals
  - Reviews
  - Settings
- Can hard delete:
  - Draft proposals (no reviews)
  - Expired sessions

---

## 📊 Toggle State Management

### Rule: Toggle Audit Trail
Every toggle change should be logged:

```typescript
async function updateToggle(fieldName: string, newValue: boolean, adminId: string) {
  await prisma.$transaction(async (tx) => {
    // Update setting
    await tx.systemSettings.update({
      where: { fieldName },
      data: { 
        fieldValue: newValue.toString(),
        updatedAt: new Date()
      }
    });

    // Log the change
    await tx.auditLog.create({
      data: {
        action: 'TOGGLE_UPDATE',
        entityType: 'system_settings',
        entityId: fieldName,
        oldValue: oldValue.toString(),
        newValue: newValue.toString(),
        userId: adminId,
        timestamp: new Date()
      }
    });

    // Execute side effects (auto status changes)
    if (fieldName === 'reviewEnabled' && !newValue) {
      await finalizeReviews(tx);
    }
  });
}
```

---

## 📋 Dashboard Phase Detection

### Rule: Current Phase Auto-Detection ⭐ NEW
Admin dashboard displays current phase based on toggle states:

```typescript
function getCurrentPhase(toggles: ToggleState): string {
  if (toggles.uploadProposalEnabled) return 'SUBMISSION';
  if (toggles.reviewEnabled) return 'REVIEW';
  if (toggles.uploadRevisionEnabled) return 'REVISION';
  return 'CLOSED';  // All toggles OFF
}
```

**Phase Display Colors:**
- `SUBMISSION`: Blue
- `REVIEW`: Orange
- `REVISION`: Yellow
- `CLOSED`: Red/Gray

---

## 📊 Statistics & Monitoring

### Rule: Proposal Status Breakdown ⭐ NEW
Admin dashboard shows proposal counts by status:

```typescript
const statusBreakdown = await prisma.proposal.groupBy({
  by: ['status'],
  _count: { id: true }
});

// Display with percentages:
// DRAFT: 12 (31.6%)
// SUBMITTED: 18 (47.4%)
// UNDER_REVIEW: 5 (13.2%)
// REVIEWED: 3 (7.9%)
```

---

## ⚠️ Wireframe-Specific Business Logic

### Rule: Dashboard Conditional Landing ⭐ FROM WIREFRAME
Mahasiswa dashboard shows different layouts based on team membership:

```typescript
function MahasiswaDashboard() {
  const { team } = useCurrentUserTeam();
  
  if (!team) {
    // Layout A: No Team - Show browse/create options
    return <NoTeamLanding />;
  }
  
  // Layout B: Has Team - Show team dashboard
  return <TeamDashboard team={team} />;
}
```

---

### Rule: Upload Proposal State Machine ⭐ FROM WIREFRAME
Upload proposal page has 4 different layouts based on state:

| Layout | Condition | Action |
|--------|-----------|--------|
| **A** | Toggle Upload Proposal = ON, belum upload | Upload proposal original |
| **B** | Original reviewed, Toggle Upload Ulang = OFF | Lihat hasil review, revisi locked |
| **C** | Original reviewed, Toggle Upload Ulang = ON | Upload proposal revisi |
| **D** | Kedua proposal sudah upload | Lihat kedua proposal |

---

### Rule: Kriteria Bobot Total Validation ⭐ FROM WIREFRAME
When admin creates/edits kriteria substantif:

```typescript
async function validateBobotTotal(jenisPkmId: number, newBobot: number, excludeId?: number) {
  const existingKriteria = await prisma.kriteriaSubstansi.findMany({
    where: { 
      jenisPkmId,
      id: excludeId ? { not: excludeId } : undefined
    }
  });
  
  const currentTotal = existingKriteria.reduce((sum, k) => sum + k.bobot, 0);
  const newTotal = currentTotal + newBobot;
  
  if (newTotal !== 100) {
    throw new BadRequestException(
      `Total bobot harus 100. Saat ini: ${newTotal}`
    );
  }
}
```

**Display:**
```
⚠️ Total Bobot PKM-KC: 75/100
[Add new kriteria with bobot: 25 to reach 100]
```

---

**These rules are non-negotiable. Implement defensive checks even if frontend validates.**
