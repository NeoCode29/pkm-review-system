# Application Page Structure
## PKM Review Application - Complete Page Flow

> **Based on**: User wireframe sketches  
> **Date**: 2026-02-04

---

## 📊 Overview: Pages by Role

| Role | Total Pages | Core Features |
|------|-------------|---------------|
| **Mahasiswa** | 10 pages | Team management (1 team only), proposal submission, review results |
| **Reviewer** | 7 pages | Proposal review, scoring, annotations |
| **Admin** | 16+ pages | User management, toggle control, master data, reviewer creation |

---

## 👨‍🎓 Mahasiswa Pages (9 Pages)

### 1. Login Page
**Route**: `/login`

**Features**:
- Email + password authentication
- "Remember me" checkbox
- Link to register
- Forgot password link
- Role detection (redirect to appropriate dashboard)

**After Login**: → Dashboard

---

### 2. Register Page
**Route**: `/register`

**Features**:
- NIM input (unique, 12 digits)
- Nama lengkap
- Email (unique)
- Password + confirmation
- No HP
- Jurusan (dropdown)
- Program Studi (dropdown, filtered by jurusan)
- Auto-create mahasiswa profile after user creation

**After Register**: → Login (with success message)

---

### 3. Dashboard (Mahasiswa) ⭐ UPDATED
**Route**: `/mahasiswa/dashboard`

**Conditional Landing** (NEW):
```typescript
if (!myTeam) {
  // No team yet - show browse/create options
  return <NoTeamLanding />;
}
// Has team - show team dashboard
return <TeamDashboard team={myTeam} />;
```

**Layout A: No Team (NoTeamLanding)**:
```
┌─────────────────────────────────────┐
│ Header (Nama, Role, Logout)         │
├─────────────────────────────────────┤
│ Anda Belum Bergabung dalam Team    │
├─────────────────────────────────────┤
│ [+ Buat Team Baru]                  │
│ [🔍 Cari Team untuk Join]           │
├─────────────────────────────────────┤
│ Team yang Tersedia:                 │
│ [Team cards preview list]           │
└─────────────────────────────────────┘
```

**Layout B: Has Team (TeamDashboard)**:
```
┌─────────────────────────────────────┐
│ Header (Nama, Role, Logout)         │
├─────────────────────────────────────┤
│ My Team: [Team Name]                │
│ Quick Stats:                        │
│ - Proposal Status                   │
│ - Current Phase                     │
├─────────────────────────────────────┤
│ [Lihat Detail Team]                 │
└─────────────────────────────────────┘
```

**Business Rule**: ⚠️ **One team per mahasiswa** - cannot join/create if already in a team

---

### 4. Browse Teams (Search & Join) ⭐ NEW
**Route**: `/mahasiswa/teams/browse`

**Features**:
- Search/browse teams **accepting new members**
- Filter options:
  - By jenis PKM
  - By jurusan/prodi
  - Teams with spaces (less than 5 members)
  - Search by team name or judul proposal

**Table/Card View**:
```
┌─────────────────────────────────────┐
│ [Search Box] [Filters ▼]           │
├─────────────────────────────────────┤
│ Team Card 1:                        │
│ ├─ Nama Team                        │
│ ├─ Judul Proposal (preview)         │
│ ├─ Jenis PKM: PKM-KC                │
│ ├─ Anggota: 3/5 (need 2 more)      │
│ ├─ Ketua: John Doe (Prodi X)       │
│ ├─ Status: Open to Join ✅          │
│ └─ [Lihat Detail] [Join Team]      │
├─────────────────────────────────────┤
│ Team Card 2: ...                    │
└─────────────────────────────────────┘
```

**Visibility Rules**:
Only show teams where:
- Status team = active
- Member count < 5 (has space)
- Team is marked "open to join" (new field)
- Team does not have proposal submitted yet (status = draft)

**Actions**:
- [Lihat Detail] → Public team detail page (read-only preview)
- [Request to Join] → Send join request

**Join Request Modal**:
```
┌─────────────────────────────────────┐
│ Kirim Request Join Team?            │
│                                     │
│ Team: [Team Name]                   │
│ Ketua: [Ketua Name]                 │
│                                     │
│ Pesan (optional):                   │
│ [Textarea - introduce yourself]     │
│                                     │
│ [Batal] [Kirim Request]            │
└─────────────────────────────────────┘
```

**After Request Sent**:
- Success notification
- Button changes to "Request Pending ⏳"
- Cannot send duplicate requests

---

### 5. Form Pembuatan Team
**Route**: `/mahasiswa/teams/create`

**Features**:
- Nama team (required)
- Judul proposal (required)
- Jenis PKM (dropdown, required)
- Dosen pembimbing (search/select) - **OPTIONAL** ⭐ NEW
  - Can be left empty
  - **REQUIRED before uploading proposal**
  - Warning shown if empty
- **Open to Join** toggle (default: ON)
  - If ON: team visible in Browse Teams
  - If OFF: team private (invite only)
- Team creator automatically added as first member (ketua)
- Can add 2-4 more members (total 3-5)

**Member Addition (Two Ways)**:
1. **Direct Add** (if you know them):
   - Search by NIM/nama
   - Show mahasiswa info (nama, prodi)
   - Add immediately
   
2. **Wait for Join Requests** (if open to join):
   - Others can find and request to join
   - You approve/reject requests later

**Validation**:
- Creator's max 2 teams check
- Minimum 3 members to submit proposal (can create with 1)

**After Submit**: → Detail Team (newly created)

---

### 5. List Semua Team
**Route**: `/mahasiswa/teams`

**Features**:
- Table/cards showing all user's teams
- Columns:
  - Nama team
  - Judul proposal
  - Jenis PKM
  - Status proposal (badge with color)
  - Action buttons

**Filters**:
- By jenis PKM
- By proposal status

**Actions per team**:
- [Lihat Detail] → Detail team

**Business Rule**: Mahasiswa can be in max 2 active teams

---

### 6. Detail Team
**Route**: `/mahasiswa/teams/:teamId`

**Layout**:
```
┌─────────────────────────────────────┐
│ Team Info                           │
│ - Nama, Judul, Jenis PKM           │
│ - Dosen pembimbing                  │
│ - Open to Join: ✅ Yes / ❌ No      │
├─────────────────────────────────────┤
│ Pending Join Requests (if any) ⭐   │
│ ┌─────────────────────────────────┐ │
│ │ Budi Santoso (12345678)         │ │
│ │ Prodi: Teknik Informatika       │ │
│ │ Message: "Saya tertarik join..."│ │
│ │ [✓ Terima] [✗ Tolak]           │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Anggota Team (3-5 members)         │
│ - List with role (ketua/anggota)   │
│ - Actions: Edit team, Kick member   │
│ - [+ Undang Mahasiswa] (manual)     │
├─────────────────────────────────────┤
│ Proposal Section                    │
│ - Current status (badge)            │
│ - Upload/revision buttons (conditional) │
│ - Downloaded files                  │
├─────────────────────────────────────┤
│ Review Results (if reviewed)        │
│ - Administratif score               │
│ - Substantif score                  │
│ - [Lihat Detail Penilaian]         │
└─────────────────────────────────────┘
```

**Join Request Management** (ALL members can do):
- View pending join requests
- [Terima] - Add to team (if space available)
- [Tolak] - Reject request
- **Always visible** (no auto-hide) ⭐ NEW
- Show "Team Full (5/5)" message if no space

**Conditional Actions** (based on toggle + status):
- **If uploadProposalEnabled = true AND status = draft**:
  - [Upload Proposal] → Upload proposal page
  
- **If status = needs_revision AND uploadRevisionEnabled = true**:
  - [Upload Ulang Final Proposal] → Upload proposal page
  
- **If status = reviewed/not_reviewed**:
  - [Lihat Hasil Penilaian] → Hasil penilaian page

**Navigation**:
- [Edit Data Team] → Edit data team page
- [Upload Proposal] → Upload proposal page
- [Lihat Hasil Penilaian] → Hasil penilaian page
- [Upload Ulang Final Proposal] → Upload proposal page
- [Undang Mahasiswa] → Manual invite modal ⭐ NEW

---

### 7. Edit Data Team
**Route**: `/mahasiswa/teams/:teamId/edit`

**Features** (ALL members can do this):
- Edit nama team
- Edit judul proposal
- Edit dosen pembimbing
- Add/remove members (3-5 validation)
- Change member roles (ketua/anggota)

**Restrictions**:
- Cannot edit if proposal status = submitted/under_review/reviewed
- Can only edit in draft status

**After Save**: → Detail team

---

### 8. Upload Proposal
**Route**: `/mahasiswa/teams/:teamId/upload`

**Features**:
- File upload (PDF only, max 10MB)
- File preview before submit
- Proposal type auto-detected:
  - If no proposal exists → "original"
  - If status = needs_revision → "revised"

**Validation**:
- Check toggle status (uploadProposalEnabled or uploadRevisionEnabled)
- Check file type (PDF only)
- Check file size (max 10MB)
- Team must have 3-5 members
- **Dosen pembimbing REQUIRED** ⭐ NEW
  - If null: show error + link to edit team
  - Cannot proceed without dosen pembimbing

**After Upload**:
- If original: status draft → submitted
- If revised: status needs_revision → revised
- → Detail team (with success message)

---

### 8a. Edit Proposal ⭐ NEW
**Route**: `/mahasiswa/teams/:teamId/edit-proposal`

**When Available**: Only when `proposal.status = needs_revision`

**Features**:
- Edit judul proposal
- Edit dosen pembimbing
- Add/remove team members (3-5 validation)
- Cannot edit proposal file (must upload new revision)

**Restrictions**:
- Only available in `needs_revision` status
- Disabled in all other statuses

**After Save**: → Detail team

---

### 9. Hasil Penilaian
**Route**: `/mahasiswa/teams/:teamId/results`

**Layout**:
```
┌─────────────────────────────────────┐
│ Proposal Info                       │
│ - Team, Judul, Jenis PKM           │
│ - Status: Reviewed                  │
├─────────────────────────────────────┤
│ Penilaian Administratif ⭐ NEW     │
│ ┌───────────────────────────────┐ │
│ │ Jumlah Kesalahan: 3             │ │
│ │ Catatan: "...reviewer notes..." │ │
│ └───────────────────────────────┘ │
├─────────────────────────────────────┤
│ Penilaian Substantif ⭐ NEW        │
│ ┌───────────────────────────────┐ │
│ │ Kriteria    | Skor | Bobot | Nilai │ │
│ │ Kreativitas | 85   | × 3   | = 255 │ │
│ │ Kelayakan   | 90   | × 5   | = 450 │ │
│ │ Penyajian   | 78   | × 2   | = 156 │ │
│ │ TOTAL SKOR: 861                 │ │
│ └───────────────────────────────┘ │
├─────────────────────────────────────┤
│ PDF Viewer with Annotations         │
│ - Highlights from reviewers         │
│ - Comments/notes                    │
│ - Can download annotated PDF        │
└─────────────────────────────────────┘
```

**Features**:
- **Administratif**: Show error count only (not full checklist)
- **Substantif**: Show calculation table (skor × bobot)
- NO total score combining both
- PDF viewer with reviewer highlights/comments
- Download original PDF
- Download annotated PDF (with reviewer notes)

---

## 👨‍🏫 Reviewer Pages (7 Pages)

### 1. Login Page
**Route**: `/login` (shared with other roles)

**After Login**: Role detection → Reviewer dashboard

---

### 2. Register Page
**Note**: Reviewers **CANNOT** self-register  
Reviewer accounts created by admin only

---

### 3. Dashboard (Reviewer)
**Route**: `/reviewer/dashboard`

**Layout**:
```
┌─────────────────────────────────────┐
│ Header (Nama, Role, Logout)         │
├─────────────────────────────────────┤
│ Welcome Message                      │
│ Stats:                              │
│ - Assigned Proposals (count)        │
│ - Completed Reviews (count)         │
│ - Pending Reviews (count)           │
│ - Review Phase Status (ON/OFF)      │
├─────────────────────────────────────┤
│ Quick Actions:                      │
│ [Lihat Daftar Proposal]            │
└─────────────────────────────────────┘
```

**Phase Indicator**:
- If reviewEnabled = true: "Review Phase ACTIVE" (green)
- If reviewEnabled = false: "Review Phase CLOSED" (red)

**Navigation**:
- → Penilaian (list proposal)
- → Logout

---

### 4. Penilaian - List Proposal
**Route**: `/reviewer/proposals`

**Features**:
- Table showing **ONLY assigned proposals**
- Columns:
  - Team name
  - Judul proposal
  - Jenis PKM
  - Review status (Not started / In progress / Completed)
  - Action buttons

**Filters**:
- By jenis PKM
- By review status
- By review completion

**Actions per proposal**:
- [Review] → Detail proposal

**Indicators**:
- If reviewEnabled = false: Show warning "Review phase is closed. Cannot submit/edit reviews."

---

### 5. Detail Proposal
**Route**: `/reviewer/proposals/:proposalId`

**Layout**:
```
┌─────────────────────────────────────┐
│ Proposal Info                       │
│ - Team, Judul, Jenis PKM           │
│ - Members list                      │
│ - Dosen pembimbing                  │
├─────────────────────────────────────┤
│ PDF Viewer (Left Column)            │
│ - Annotation tools                  │
│ - Highlight tool                    │
│ - Comment tool                      │
│ - Page navigation                   │
├─────────────────────────────────────┤
│ Review Tabs (Right Column)          │
│ [Administratif] [Substantif]       │
│                                     │
│ Tab content shows forms             │
└─────────────────────────────────────┘
```

**Navigation**:
- [Penilaian Administratif] tab → Penilaian administratif form
- [Penilaian Substantif] tab → Penilaian substantif form

**Save State**:
- Auto-save as draft
- Final submit button

---

### 6. Penilaian Administratif
**Route**: `/reviewer/proposals/:proposalId/administratif` (tab)

**Features**:
- Checklist of criteria (from KriteriaAdministrasi)
- Each criterion: checkbox "Ada Kesalahan?"
- Total kesalahan (auto-calculated)
- Catatan/notes (textarea)

**Data Model**:
```typescript
{
  criteria: [
    { id: 1, deskripsi: "...", adaKesalahan: true/false },
    { id: 2, deskripsi: "...", adaKesalahan: true/false },
  ],
  totalKesalahan: 2, // auto-count
  catatan: "...",
  isComplete: false // mark as complete
}
```

**Actions**:
- [Simpan Draft] - Save without marking complete
- [Submit Final] - Mark isComplete = true
- **Disabled if reviewEnabled = false**

---

### 7. Penilaian Substantif
**Route**: `/reviewer/proposals/:proposalId/substantif` (tab)

**Features**:
- List of criteria (from KriteriaSubstansi)
- Each criterion:
  - Nama kriteria
  - Deskripsi
  - **Bobot** (simple number, not %) ⭐ NEW
  - Skor input (skorMin - skorMax range)
  - **Nilai = skor × bobot** (auto-calculated)
- **Total skor = SUM(all nilai)** ⭐ NEW
- Catatan/notes (textarea)

**Data Model** ⭐ UPDATED:
```typescript
{
  criteria: [
    { 
      id: 1, 
      nama: "Kreativitas", 
      bobot: 3,        // Simple number (not percentage)
      skorMin: 0, 
      skorMax: 100, 
      skor: 85,        // Reviewer input
      nilai: 255       // Auto: 85 × 3 = 255
    },
    { 
      id: 2, 
      nama: "Kelayakan", 
      bobot: 5, 
      skor: 90, 
      nilai: 450       // Auto: 90 × 5 = 450
    },
  ],
  totalSkor: 705,     // SUM(255 + 450)
  catatan: "...",
  isComplete: false
}
```

**Display**:
```
┌─────────────────────────────────────┐
│ Kriteria    | Bobot | Skor | Nilai     │
├─────────────────────────────────────┤
│ Kreativitas | × 3   | [85] | = 255     │
│ Kelayakan   | × 5   | [90] | = 450     │
│ Penyajian   | × 2   | [78] | = 156     │
├─────────────────────────────────────┤
│ TOTAL SKOR                 | 861     │
└─────────────────────────────────────┘
```

**Validation**:
- Skor must be within skorMin - skorMax range
- All criteria must be scored

**Actions**:
- [Simpan Draft] - Save without marking complete
- [Submit Final] - Mark isComplete = true
- **Disabled if reviewEnabled = false**

---

## 👨‍💼 Admin Pages (15+ Pages)

### 1. Login Page
**Route**: `/login` (shared)

---

### 2. Dashboard (Admin)
**Route**: `/admin/dashboard`

**Layout**:
```
┌─────────────────────────────────────┐
│ Header (Admin, Logout)              │
├─────────────────────────────────────┤
│ System Stats:                       │
│ - Total Users                       │
│ - Total Teams                       │
│ - Total Proposals (by status)       │
│ - Current Toggle States             │
├─────────────────────────────────────┤
│ Navigation Menu:                    │
│ - Manajemen User                    │
│ - Manajemen Team                    │
│ - Manajemen Penilaian (Kriteria)   │
│ - Manajemen Reviewer                │
│ - Manajemen Data Tambahan           │
│ - Settings (Toggles)                │
└─────────────────────────────────────┘
```

**Current Phase Indicator** (large, prominent):
```
┌─────────────────────────────────────┐
│ Current Phase: SUBMISSION           │
│ ● Upload Proposal: ON               │
│ ○ Review: OFF                       │
│ ○ Upload Revision: OFF              │
└─────────────────────────────────────┘
```

---

### 3. Manajemen User
**Route**: `/admin/users`

**Features**:
- List all users (admin, mahasiswa, reviewer)
- Table columns:
  - Nama
  - Email
  - Role
  - Status (active/inactive)
  - Actions

**Actions**:
- [Edit Role] → Modal to change role
- [Deactivate/Activate]

**Filters**:
- By role
- By status

---

### 4. Manajemen User ⭐ UPDATED
**Route**: `/admin/users`

**Features**:
- List all users (admin, mahasiswa, reviewer)
- Table columns:
  - Nama
  - Email
  - Role
  - Status (active/inactive)
  - Actions

**Actions**:
- **[Deactivate/Activate]** only
- **NO edit role feature** (removed)

**New Feature**:
- **[+ Tambah Reviewer]** button ⭐ NEW
  - → Form create reviewer directly

**Filters**:
- By role
- By status

---

### 4a. Form Tambah Reviewer ⭐ NEW
**Route**: `/admin/users/create-reviewer`

**Features**:
- Direct reviewer account creation (one-step)
- No need to create as mahasiswa then edit role

**Form Fields**:
- Nama lengkap (required)
- NIDN (required, unique)
- Email (required, unique)
- Password (required)
- No HP (optional)
- Program Studi (dropdown, required)

**Business Logic**:
```typescript
// Creates user + reviewer profile in one transaction
const user = await prisma.user.create({
  email, password, role: 'reviewer'  // Direct assignment
});
const reviewer = await prisma.reviewer.create({
  userId: user.id, nama, nidn, ...
});
```

**After Submit**: → Manajemen User (with success message)

---

### 5. Manajemen Team ⭐ UPDATED
**Route**: `/admin/teams`

**Features**:
- List ALL teams (全部)
- Table columns:
  - Nama team
  - Judul proposal
  - Ketua (nama)
  - Jenis PKM
  - Member count
  - Proposal status
  - Actions

**Actions** (RUD):
- [Lihat Detail] → Detail team
- [Edit] → Edit team
- **[Delete]** → Delete team ⭐ UPDATED
  - **Can delete anytime** (no restrictions)
  - Strong confirmation required
  - Shows cascade impact: "Will delete X proposals and Y reviews"

**Filters**:
- By jenis PKM
- By proposal status
- By jurusan

**Delete Confirmation**:
```
┌─────────────────────────────────────┐
│ Hapus Team?                          │
│                                     │
│ PERINGATAN: Ini akan menghapus:      │
│ - Team beserta 5 anggota            │
│ - 1 proposal                        │
│ - 2 review yang sudah dibuat        │
│                                     │
│ Aksi ini TIDAK BISA DIBATALKAN!     │
│                                     │
│ [Batal] [Ya, Hapus Permanen]       │
└─────────────────────────────────────┘
```

---

### 6. Detail Team (Admin View)
**Route**: `/admin/teams/:teamId`

**Similar to mahasiswa view but:**
- Full edit capabilities
- Can see all proposals
- Can manually change status (override)
- Can assign reviewers

---

### 7. Edit Team (Admin)

**Route**: `/admin/teams/:teamId/edit`

**Full control**:
- Edit any field
- Change members (no restriction)
- Override validations
- Delete team (if safe)

---

### 8. Manajemen Penilaian - Kriteria
**Route**: `/admin/penilaian`

**Two Sub-sections**:

#### 8a. Kriteria Administrasi
**Route**: `/admin/penilaian/administratif`

**Features** (CRUD):
- List criteria by jenis PKM
- Add new criterion
- Edit existing
- Delete (if not used in reviews)
- Reorder (urutan)

**Fields**:
- Jenis PKM (select)
- Deskripsi
- Urutan

#### 8b. Kriteria Substantif
**Route**: `/admin/penilaian/substantif`

**Features** (CRUD):
- List criteria by jenis PKM
- Add new criterion
- Edit existing
- Delete (if not used)
- Reorder

**Fields**:
- Jenis PKM (select)
- Nama kriteria
- Deskripsi
- **Bobot** (simple number) ⭐ NEW
- Skor min
- Skor max
- Urutan

**Bobot Validation** ⭐ UPDATED:
- Bobot must be > 0
- **NO "total = 100%" validation** (not using percentages)
- Display: "Bobot: 5" (not "Bobot: 5%")
- Input: `<input type="number" min="1" placeholder="Contoh: 5" />`

**Calculation Display**:
```
Kriteria: Kreativitas
Bobot: 3
Calculation: skor × bobot = nilai
Contoh: 85 × 3 = 255
```

---

### 9. Manajemen Reviewer
**Route**: `/admin/reviewers`

**Features**:
- List all reviewer users
- Table columns:
  - Nama
  - NIDN
  - Email
  - No HP
  - Assigned proposals (count)
  - Actions

**Actions**:
- [Lihat Penugasan] → List item penilaian
- [Assign to Proposal] → Form penugasan

---

### 10. List Item Penilaian (Reviewer Assignments)
**Route**: `/admin/reviewers/:reviewerId/assignments`

**Features**:
- List all proposals assigned to this reviewer
- Table columns:
  - Team name
  - Judul proposal
  - Reviewer number (1 or 2)
  - Review status
  - Actions

**Actions**:
- [Detail] → Detail hasil penilaian
- [Batalkan Penugasan] (if reviewEnabled = true)

---

### 11. Form Penugasan (Assign Reviewers)
**Route**: `/admin/proposals/:proposalId/assign-reviewers`

**Features**:
- Select 2 reviewers from dropdown
- Include list of proposals for context
- Show current assignments
- Validate: cannot assign same reviewer twice

**Business Rule**:
- Can assign BEFORE or DURING review phase
- Cannot assign AFTER review phase ended (reviewEnabled = false)

**After Assign**: → List proposal or Reviewer management

---

### 12. Detail Hasil Penilaian (Admin View)
**Route**: `/admin/proposals/:proposalId/reviews/:reviewerAssignmentId`

**Features**:
- Read-only view of review
- See administratif checklist
- See substantif scores
- See catatan/notes
- See PDF annotations
- Compare with other reviewer (if 2 reviews exist)

---

### 13. Manajemen Data Tambahan
**Route**: `/admin/master-data`

**Sub-sections** (all CRUD):

#### 13a. List Prodi
**Route**: `/admin/master-data/prodi`
- CRUD program studi
- Grouped by jurusan
- Fields: jurusan, nama prodi

#### 13b. List Jurusan
**Route**: `/admin/master-data/jurusan`
- CRUD jurusan
- Fields: nama jurusan

#### 13c. List Jenis PKM
**Route**: `/admin/master-data/jenis-pkm`
- CRUD jenis PKM
- Fields: nama, kode, deskripsi

---

### 14. Settings (Toggles)
**Route**: `/admin/settings`

**Layout** (Radio buttons - Auto-Exclusive):
```
┌─────────────────────────────────────┐
│ System Workflow Control             │
├─────────────────────────────────────┤
│ Select Active Phase:                │
│                                     │
│ ○ Upload Proposal (Submission)      │
│   → Mahasiswa can submit proposals  │
│                                     │
│ ○ Review (Review Period)            │
│   → Reviewers can review proposals  │
│                                     │
│ ○ Upload Revision (Revision)        │
│   → Mahasiswa can upload revisions  │
│                                     │
│ ○ None (System Closed)              │
│   → All activities paused           │
│                                     │
│ Current: ● Review (Active)          │
│                                     │
│ [Update Phase]                      │
└─────────────────────────────────────┘
```

**Toggle Behavior** (Auto-Exclusive):
- Clicking one radio = auto turns OFF others
- Confirmation modal before toggle ON (shows what will happen)
- Show affected proposals count

**Confirmation Modal Example**:
```
Activate Review Phase?

This will:
✓ Auto-transition all "submitted" → "under_review" (15 proposals)
✓ Auto-turn OFF "Upload Proposal"
✓ Enable reviewers to submit reviews

Proceed?
[Cancel] [Confirm]
```

---

### 15. Settings - Toggle Details (3 sections)

#### 15a. Toggle Pengumpulan (Upload Proposal)
**When ON**:
- Mahasiswa can upload & submit proposals
- Status: draft → submitted

**When OFF**:
- Mahasiswa cannot submit

#### 15b. Toggle Hasil Reviewer (Review)
**When ON**:
- Auto: submitted → under_review
- Reviewers can submit/edit reviews

**When OFF**:
- Auto: under_review → reviewed/not_reviewed
- Reviews locked (cannot edit)

#### 15c. Toggle Final Pengumpulan (Upload Revision)
**When ON**:
- Auto: reviewed → needs_revision
- Mahasiswa can upload revisions

**When OFF**:
- Mahasiswa cannot upload revisions

---

## 🗺️ Route Structure Summary

### Public Routes:
```
/login
/register (mahasiswa only)
```

### Mahasiswa Routes:
```
/mahasiswa/dashboard
/mahasiswa/teams (list)
/mahasiswa/teams/create
/mahasiswa/teams/:id (detail)
/mahasiswa/teams/:id/edit
/mahasiswa/teams/:id/upload
/mahasiswa/teams/:id/results
```

### Reviewer Routes:
```
/reviewer/dashboard
/reviewer/proposals (list assigned)
/reviewer/proposals/:id (detail)
/reviewer/proposals/:id/administratif (tab)
/reviewer/proposals/:id/substantif (tab)
```

### Admin Routes:
```
/admin/dashboard

/admin/users
/admin/users/:id/edit-role

/admin/teams
/admin/teams/:id (detail)
/admin/teams/:id/edit

/admin/penilaian/administratif
/admin/penilaian/substantif

/admin/reviewers
/admin/reviewers/:id/assignments
/admin/proposals/:id/assign-reviewers
/admin/proposals/:id/reviews/:reviewerId

/admin/master-data/prodi
/admin/master-data/jurusan
/admin/master-data/jenis-pkm

/admin/settings (toggles)
```

---

## 🎨 UI/UX Considerations

### Conditional Rendering:
Every page must check:
1. **User role** - Route protection
2. **Toggle status** - Show/hide upload buttons
3. **Proposal status** - Enable/disable actions
4. **Review phase** - Lock/unlock review forms

### Status Badges:
Use consistent color coding:
- `draft` - Gray
- `submitted` - Blue
- `under_review` - Yellow
- `reviewed` - Green
- `not_reviewed` - Red
- `needs_revision` - Orange
- `revised` - Purple

### Phase Indicators:
Always show current active phase prominently:
- Mahasiswa sees: "Submission Open" / "Review in Progress" / "Revision Period"
- Reviewer sees: "Review Active" / "Review Closed"
- Admin sees: All three toggle states

---

**Total Pages**: ~30 pages across all roles  
**Key Integration**: Toggle states drive all conditional UI
