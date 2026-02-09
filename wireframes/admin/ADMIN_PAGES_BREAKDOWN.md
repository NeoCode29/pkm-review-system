# Admin Wireframe Pages Breakdown

> **Project**: PKM Review System  
> **Role**: Admin (Administrator)  
> **Total Pages**: 15 halaman  
> **Date**: 2026-02-06

---

## 📊 Overview

Admin memiliki akses penuh ke sistem untuk:
- Manajemen user (activate/deactivate)
- Manajemen team (CRUD penuh)
- Manajemen kriteria penilaian (administratif & substantif)
- Manajemen reviewer & assignment
- Master data (prodi, jurusan, jenis PKM)
- System toggles (kontrol workflow)

---

## 🗂️ Page Categories

| Category | Pages | Purpose |
|----------|-------|---------|
| **Dashboard** | 1 | Overview & quick stats |
| **User Management** | 2 | Users list + create reviewer |
| **Team Management** | 3 | Teams list + detail + edit |
| **Kriteria Penilaian** | 2 | Administratif + Substantif |
| **Reviewer Management** | 4 | Reviewers + assignments + assign form + review detail |
| **Master Data** | 3 | Prodi + Jurusan + Jenis PKM |
| **Settings** | 1 | System toggles |

---

## 📄 Detailed Page Breakdown

### 1️⃣ Dashboard (Admin)
**File**: `01-dashboard.html`  
**Route**: `/admin/dashboard`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header: [LOGO] + Admin + Logout            │
├────────────────────────────────────────────┤
│ Sidebar (fixed 200px):                     │
│ - Dashboard                                │
│ - Manajemen User                           │
│ - Manajemen Team                           │
│ - Manajemen Penilaian                      │
│ - Manajemen Reviewer                       │
│ - Master Data                              │
│ - Settings                                 │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ ┌────────────────────────────────────────┐ │
│ │ CURRENT PHASE BOX (prominent, colored) │ │
│ │ - Phase name                           │ │
│ │ - Toggle states (● ON / ○ OFF)         │ │
│ │ - [Manage Toggles] button              │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─────────────┬─────────────┐             │
│ │ Total Users │ Total Teams │             │
│ │    234      │     45      │             │
│ └─────────────┴─────────────┘             │
│                                            │
│ ┌─────────────┬─────────────┐             │
│ │ Proposals   │ Reviewers   │             │
│ │    38       │     12      │             │
│ └─────────────┴─────────────┘             │
│                                            │
│ Proposal Status Breakdown Table:           │
│ ┌──────────────┬───────┬──────────┐       │
│ │ Status       │ Count │ %        │       │
│ ├──────────────┼───────┼──────────┤       │
│ │ DRAFT        │  12   │ 31.6%    │       │
│ │ SUBMITTED    │  18   │ 47.4%    │       │
│ │ UNDER REVIEW │   5   │ 13.2%    │       │
│ │ REVIEWED     │   3   │  7.9%    │       │
│ └──────────────┴───────┴──────────┘       │
│                                            │
│ Quick Actions:                             │
│ [+ Tambah Reviewer] [Assign Reviewers]    │
│ [Export Data]                              │
└────────────────────────────────────────────┘
```

#### Content Details:
- **Current Phase Box**: Large, colored alert showing active phase
  - Examples: "SUBMISSION", "REVIEW", "REVISION", "CLOSED"
  - Toggle status indicators (bullet filled/empty)
  - Quick link to settings
  
- **Stats (4 boxes in 2x2 grid)**:
  - Total Users: Count all users (admin + mahasiswa + reviewer)
  - Total Teams: Count all teams
  - Proposals Submitted: Count submitted proposals
  - Active Reviewers: Count reviewers with assignments

- **Proposal Status Table**:
  - Columns: Status badge, Count, Percentage
  - 7 rows: draft, submitted, under_review, reviewed, not_reviewed, needs_revision, revised

- **Quick Actions**: 3 prominent buttons

#### Business Rules:
- Current phase auto-detected from toggle states
- Stats update real-time
- Color coding: green (active), red (closed), yellow (warning)

---

### 2️⃣ Manajemen User
**File**: `02-user-list.html`  
**Route**: `/admin/users`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header + Sidebar (same as dashboard)      │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ Title: Manajemen User                      │
│                                            │
│ [+ Tambah Reviewer] button (top-right)    │
│                                            │
│ Filters:                                   │
│ [Filter by Role ▼] [Filter by Status ▼]   │
│ [Search box]                               │
│                                            │
│ User Table:                                │
│ ┌──────┬───────┬──────┬────────┬─────────┐│
│ │ Nama │ Email │ Role │ Status │ Actions ││
│ ├──────┼───────┼──────┼────────┼─────────┤│
│ │ ...  │ ...   │ ...  │ ...    │ [Act]   ││
│ └──────┴───────┴──────┴────────┴─────────┘│
│                                            │
│ Pagination: [Prev] 1 2 3 [Next]           │
└────────────────────────────────────────────┘
```

#### Content Details:
- **Header Action**: [+ Tambah Reviewer] button → goto create reviewer form

- **Filters** (3 controls):
  - Role dropdown: All / Admin / Mahasiswa / Reviewer
  - Status dropdown: All / Active / Inactive
  - Search input: Search by name or email

- **Table Columns** (5):
  1. **Nama**: Full name
  2. **Email**: Email address
  3. **Role**: Badge (admin/mahasiswa/reviewer)
  4. **Status**: Badge (active/inactive)
  5. **Actions**: 
     - [Activate] or [Deactivate] button
     - NO edit role (removed feature)

#### Sample Data:
```
| Nama              | Email                  | Role      | Status   |
|-------------------|------------------------|-----------|----------|
| Admin Utama       | admin@pkm.ac.id        | ADMIN     | ACTIVE   |
| Budi Santoso      | budi@student.ac.id     | MAHASISWA | ACTIVE   |
| Dr. Siti Nurhaliza| siti@staff.ac.id       | REVIEWER  | ACTIVE   |
| Andi Prasetyo     | andi@student.ac.id     | MAHASISWA | INACTIVE |
```

#### Business Rules:
- Cannot deactivate yourself (current admin)
- Deactivating user = hide from system (soft delete)
- Show confirmation before deactivate: "User will lose access"

---

### 3️⃣ Form Tambah Reviewer
**File**: `03-create-reviewer.html`  
**Route**: `/admin/users/create-reviewer`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header + Sidebar                           │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ Title: Tambah Reviewer Baru                │
│                                            │
│ Form (centered, max-width 600px):          │
│ ┌────────────────────────────────────────┐ │
│ │ Label: Nama Lengkap *                  │ │
│ │ [Text input]                           │ │
│ │                                        │ │
│ │ Label: NIDN * (Nomor Induk Dosen)      │ │
│ │ [Number input, unique]                 │ │
│ │                                        │ │
│ │ Label: Email *                         │ │
│ │ [Email input, unique]                  │ │
│ │                                        │ │
│ │ Label: Password *                      │ │
│ │ [Password input]                       │ │
│ │                                        │ │
│ │ Label: No HP                           │ │
│ │ [Tel input, optional]                  │ │
│ │                                        │ │
│ │ Label: Program Studi *                 │ │
│ │ [Dropdown: prodi options]              │ │
│ │                                        │ │
│ │ [Batal] [Simpan Reviewer]              │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

#### Content Details:
- **Form Fields** (6 fields):
  1. **Nama Lengkap** (required): Text input, placeholder "Dr. Ahmad Fauzi, M.Kom"
  2. **NIDN** (required, unique): Number input, placeholder "0123456789"
  3. **Email** (required, unique): Email input with validation
  4. **Password** (required): Password input, min 8 characters
  5. **No HP** (optional): Tel input, placeholder "08123456789"
  6. **Program Studi** (required): Dropdown from master data

- **Buttons**:
  - [Batal] → Back to user list
  - [Simpan Reviewer] → Create user + reviewer profile

#### Validation Rules:
- NIDN must be unique (check against existing)
- Email must be unique and valid format
- Password min 8 characters
- Program Studi must be selected

#### Business Logic:
```typescript
// One transaction creates both:
1. User record (email, password, role='reviewer')
2. Reviewer profile (userId, nama, nidn, etc)
```

---

### 4️⃣ Manajemen Team
**File**: `04-team-list.html`  
**Route**: `/admin/teams`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header + Sidebar                           │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ Title: Manajemen Team                      │
│                                            │
│ Filters:                                   │
│ [Jenis PKM ▼] [Status ▼] [Jurusan ▼]     │
│ [Search box]                               │
│                                            │
│ Team Table:                                │
│ ┌──────┬──────┬──────┬──────┬──────┬─────┐│
│ │ Team │Judul │Ketua │ PKM  │Count │Acts ││
│ ├──────┼──────┼──────┼──────┼──────┼─────┤│
│ │ ...  │ ...  │ ...  │ ...  │ 5/5  │[..] ││
│ └──────┴──────┴──────┴──────┴──────┴─────┘│
└────────────────────────────────────────────┘
```

#### Content Details:
- **Filters** (4 controls):
  - Jenis PKM dropdown: All / PKM-KC / PKM-GT / PKM-K / etc
  - Status dropdown: All statuses
  - Jurusan dropdown: All / Teknik / Ekonomi / etc
  - Search: Team name or proposal title

- **Table Columns** (7):
  1. **Nama Team**: Team name
  2. **Judul Proposal**: Proposal title (truncated)
  3. **Ketua**: Ketua name
  4. **Jenis PKM**: Badge
  5. **Members**: X/5 count
  6. **Proposal Status**: Badge
  7. **Actions**: 3 buttons
     - [Lihat Detail]
     - [Edit]
     - [Delete] (red, destructive)

#### Sample Data:
```
| Team              | Judul                   | Ketua         | PKM    | Count | Status    |
|-------------------|-------------------------|---------------|--------|-------|-----------|
| Tim Inovasi       | Aplikasi AR             | Budi Santoso  | PKM-KC | 5/5   | SUBMITTED |
| Tim Teknologi     | Monitoring IoT          | Andi P.       | PKM-GT | 3/5   | DRAFT     |
| Tim AI Research   | Chatbot NLP             | Sarah W.      | PKM-KC | 4/5   | REVIEWED  |
```

#### Delete Confirmation Modal:
```
┌─────────────────────────────────────┐
│ Hapus Team: Tim Inovasi Digital?    │
│                                     │
│ ⚠️ PERINGATAN: Ini akan menghapus:   │
│ - Team beserta 5 anggota            │
│ - 1 proposal                        │
│ - 2 review yang sudah dibuat        │
│                                     │
│ Aksi ini TIDAK BISA DIBATALKAN!     │
│                                     │
│ Ketik "HAPUS" untuk konfirmasi:     │
│ [_______]                           │
│                                     │
│ [Batal] [Ya, Hapus Permanen]       │
└─────────────────────────────────────┘
```

#### Business Rules:
- Can delete team anytime (no restrictions)
- Must type "HAPUS" to confirm
- Shows cascade impact count

---

### 5️⃣ Detail Team (Admin View)
**File**: `05-team-detail.html`  
**Route**: `/admin/teams/:teamId`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header + Sidebar                           │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ Title: Detail Team: [Team Name]            │
│ [Edit Team] [Delete Team] (top-right)     │
│                                            │
│ 2-Column Layout:                           │
│ ┌──────────────────┬──────────────────┐   │
│ │ LEFT COLUMN      │ RIGHT COLUMN     │   │
│ │                  │                  │   │
│ │ Team Info Box    │ Anggota Box      │   │
│ │ Join Requests    │ Proposal Box     │   │
│ │                  │ Reviews Box      │   │
│ │ Admin Controls   │ Status Override  │   │
│ └──────────────────┴──────────────────┘   │
└────────────────────────────────────────────┘
```

#### Content Details:
**Left Column**:
1. **Team Info Box**:
   - Nama Team
   - Judul Proposal
   - Jenis PKM (badge)
   - Dosen Pembimbing (with link to profile)
   - Open to Join: Yes/No
   - Created date
   - Last updated

2. **Pending Join Requests** (if any):
   - List of request cards
   - Each card: Nama, NIM, prodi, message
   - Actions: [Approve] [Reject] (admin override)

3. **Admin Controls**:
   - [Assign Reviewers] → goto assign form
   - [Override Status] → dropdown to manually change
   - [Delete Team] → confirmation modal

**Right Column**:
1. **Anggota Team Box**:
   - Member cards (3-5 members)
   - Each card: Nama, NIM, prodi, role badge
   - [Add Member] button
   - [Remove Member] button per member

2. **Proposal Box**:
   - Current status badge
   - Upload date
   - File info (size, pages)
   - [Download PDF]
   - [View Reviews]

3. **Reviews Box** (if assigned):
   - Reviewer 1: Status, [View Detail]
   - Reviewer 2: Status, [View Detail]
   - Scores summary (if completed)

#### Admin-Specific Features:
- Can override any status
- Can manually add/remove members (no restrictions)
- Can assign/unassign reviewers
- Can delete team anytime

---

### 6️⃣ Edit Team (Admin)
**File**: `06-team-edit.html`  
**Route**: `/admin/teams/:teamId/edit`

#### Layout Structure:
Similar to create team form, but:
- Pre-filled with existing data
- Can edit all fields (no restrictions)
- Can override validations
- Show edit history (optional)

#### Content Details:
- **Form Fields**:
  - Nama Team (editable)
  - Judul Proposal (editable)
  - Jenis PKM (changeable dropdown)
  - Dosen Pembimbing (searchable select)
  - Open to Join toggle
  - Members management:
    - Current members list
    - [+ Add Member] search
    - [Remove] per member
    - Can have 1-5 members (admin bypass 3-5 rule)

- **Admin Override Options**:
  - [Force Save] - bypass all validations
  - [Save with Validation] - normal save

---

### 7️⃣ Kriteria Administratif
**File**: `07-kriteria-admin.html`  
**Route**: `/admin/penilaian/administratif`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header + Sidebar                           │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ Title: Kriteria Penilaian Administratif    │
│                                            │
│ Tabs: [Administratif] [Substantif]        │
│                                            │
│ Filter: Jenis PKM: [Dropdown ▼]           │
│ [+ Tambah Kriteria] (top-right)           │
│                                            │
│ Criteria List (by PKM type):               │
│ ┌────────────────────────────────────────┐ │
│ │ Kriteria 1 (urutan: 1)                 │ │
│ │ Deskripsi: Cover lengkap...            │ │
│ │ Jenis PKM: PKM-KC                      │ │
│ │ [↑ Up] [↓ Down] [Edit] [Delete]       │ │
│ ├────────────────────────────────────────┤ │
│ │ Kriteria 2 (urutan: 2)                 │ │
│ │ ...                                    │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

#### Content Details:
- **Filter**: Jenis PKM dropdown (shows criteria for selected PKM)
- **Add Button**: Opens modal/form to add new criterion

**Criteria Card**:
- Order number (urutan)
- Deskripsi (full text)
- Jenis PKM badge
- Actions:
  - [↑] Move up in order
  - [↓] Move down in order
  - [Edit] → Edit modal
  - [Delete] → Confirm (only if not used in reviews)

**Add/Edit Modal**:
```
┌─────────────────────────────────────┐
│ Tambah Kriteria Administratif       │
│                                     │
│ Jenis PKM: [Dropdown *]             │
│ Deskripsi: [Textarea *]             │
│ Urutan: [Number input *]            │
│                                     │
│ [Batal] [Simpan]                    │
└─────────────────────────────────────┘
```

#### Business Rules:
- Cannot delete if used in any reviews
- Urutan can be reordered with arrows
- Each PKM type has separate criteria list

---

### 8️⃣ Kriteria Substantif
**File**: `08-kriteria-substantif.html`  
**Route**: `/admin/penilaian/substantif`

#### Layout Structure:
Similar to administratif, plus additional fields.

#### Content Details:
**Criteria Card** (more fields):
- Order number
- Nama kriteria
- Deskripsi
- **Bobot** (must total to 100 per PKM type)
- Skor min - max range (typically 1-7)
- Jenis PKM badge
- Actions (same as administratif)

**Add/Edit Modal**:
```
┌─────────────────────────────────────┐
│ Tambah Kriteria Substantif          │
│                                     │
│ Jenis PKM: [Dropdown *]             │
│   Selected: PKM-KC                  │
│                                     │
│ Nama Kriteria: [Text *]             │
│   Placeholder: "Gagasan - Orisinalitas" │
│                                     │
│ Deskripsi: [Textarea *]             │
│                                     │
│ ⚠️ Total Bobot PKM-KC: 75/100       │
│                                     │
│ Bobot: [Number input *]             │
│   Placeholder: "15" (bukan "15%")   │
│   Min: 1, Max: 100                  │
│   Help: Tanpa simbol %              │
│                                     │
│ Skor Min: [Number *]                │
│   Default: 1                        │
│                                     │
│ Skor Max: [Number *]                │
│   Default: 7                        │
│                                     │
│ Urutan: [Number input *]            │
│                                     │
│ Calculation Preview:                │
│ Nilai = Bobot × Skor                │
│ Contoh: 15 × 6 = 90                 │
│                                     │
│ [Batal] [Simpan]                    │
└─────────────────────────────────────┘
```

#### Important Notes - ⭐ UPDATED:
- **Total bobot untuk setiap jenis PKM HARUS = 100**
- Display running total: "Total Bobot PKM-KC: 75/100"
- Bobot ditampilkan TANPA simbol % ("15" bukan "15%")
- **Validation**: Before save, check `SUM(bobot) === 100`
- If ≠ 100: Show error "Total bobot harus 100. Saat ini: {current}"
- **Skor range typically 1-7** (not 0-100):
  - 1 = Buruk
  - 2 = Sangat kurang
  - 3 = Kurang
  - 5 = Cukup
  - 6 = Baik
  - 7 = Sangat baik
- Calculation: nilai = bobot × skor

**Example Setup for PKM-KC**:
```
Kriteria 1: Gagasan - Orisinalitas → Bobot 15
Kriteria 2: Gagasan - Penyajian → Bobot 15
Kriteria 3: Gagasan - Perbandingan → Bobot 10
Kriteria 4: Kesesuaian Metode → Bobot 15
Kriteria 5: Potensi - Kontribusi → Bobot 10
Kriteria 6: Potensi - Sintesis → Bobot 15
Kriteria 7: Potensi - Kemanfaatan → Bobot 10
Kriteria 8: Penjadwalan → Bobot 5
Kriteria 9: Anggaran → Bobot 5

TOTAL BOBOT = 100 ✓
```

---

### 9️⃣ Manajemen Reviewer
**File**: `09-reviewer-list.html`  
**Route**: `/admin/reviewers`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header + Sidebar                           │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ Title: Manajemen Reviewer                  │
│                                            │
│ [+ Tambah Reviewer] (top-right)           │
│                                            │
│ Reviewer Table:                            │
│ ┌─────┬──────┬───────┬──────┬──────┬─────┐│
│ │ Nama│ NIDN │ Email │ HP   │Assign│Acts ││
│ ├─────┼──────┼───────┼──────┼──────┼─────┤│
│ │ ... │ ...  │ ...   │ ...  │  5   │[..] ││
│ └─────┴──────┴───────┴──────┴──────┴─────┘│
└────────────────────────────────────────────┘
```

#### Content Details:
- **Table Columns** (6):
  1. Nama: Reviewer full name
  2. NIDN: Nomor Induk
  3. Email: Contact email
  4. No HP: Phone (if any)
  5. Assigned: Count of assigned proposals
  6. Actions:
     - [Lihat Penugasan] → goto assignments list
     - [Assign to Proposal] → goto assign form

#### Sample Data:
```
| Nama                 | NIDN       | Email              | HP           | Assigned |
|----------------------|------------|--------------------|--------------|----------|
| Dr. Siti Nurhaliza   | 0123456789 | siti@staff.ac.id   | 08123456789  | 5        |
| Prof. Ahmad Fauzi    | 0987654321 | ahmad@staff.ac.id  | 08198765432  | 3        |
| Dr. Bambang Sutopo   | 0112233445 | bambang@staff.ac.id| -            | 0        |
```

#### Actions in Table:
- **[Lihat Detail]** → goto Detail Reviewer page ⭐ NEW
- **[Lihat Penugasan]** → goto assignments list
- **[Assign to Proposal]** → goto assign form

---

### 🔟 Detail Reviewer ⭐ NEW PAGE
**File**: `10-reviewer-detail.html`  
**Route**: `/admin/reviewers/:reviewerId`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header + Sidebar                           │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ Title: Detail Reviewer                     │
│ [← Back] [Edit Reviewer] (top-right)      │
│                                            │
│ 2-Column Layout:                           │
│ ┌──────────────────┬──────────────────┐   │
│ │ LEFT COLUMN      │ RIGHT COLUMN     │   │
│ │                  │                  │   │
│ │ Profile Info     │ Statistics       │   │
│ │ Contact Info     │ Assignments      │   │
│ │                  │ Recent Activity  │   │
│ └──────────────────┴──────────────────┘   │
└────────────────────────────────────────────┘
```

#### Content Details:
**Left Column**:
1. **Profile Info Box**:
   ```
   ┌────────────────────────────────┐
   │ DR. SITI NURHALIZA             │
   │ [Profile Picture Placeholder]  │
   ├────────────────────────────────┤
   │ NIDN: 0123456789               │
   │ Email: siti@staff.ac.id        │
   │ No HP: 08123456789             │
   │ Program Studi: Teknik Informatika │
   │ Status: ACTIVE                 │
   │ Bergabung: 2025-01-15          │
   └────────────────────────────────┘
   ```

2. **Account Actions**:
   - [Edit Profile] → Edit form
   - [Reset Password] → Send reset
   - [Deactivate Account] → Soft delete

**Right Column**:
1. **Statistics Box**:
   ```
   ┌─────────────┬─────────────┐
   │ Total       │ Completed   │
   │ Assigned    │ Reviews     │
   │    12       │      8      │
   └─────────────┴─────────────┘
   
   ┌─────────────┬─────────────┐
   │ In Progress │ Pending     │
   │      3      │      1      │
   └─────────────┴─────────────┘
   ```

2. **Current Assignments** (Preview):
   ```
   Recent Assignments:
   
   [Team Card 1]
   Team: Tim Inovasi Digital
   Proposal: Aplikasi AR
   Status: IN PROGRESS
   [Lihat Detail]
   
   [Team Card 2]
   Team: Tim AI Research
   Proposal: Chatbot NLP
   Status: COMPLETED
   [Lihat Detail]
   
   [Lihat Semua Penugasan →]
   ```

3. **Recent Activity Log**:
   ```
   Activity Timeline:
   
   • 2026-02-05: Completed review for Tim Inovasi
   • 2026-02-03: Started review for Tim AI Research
   • 2026-02-01: Assigned to 2 new proposals
   • 2026-01-30: Submitted substantif for Tim X
   ```

#### Quick Actions:
- [Assign to New Proposal] → goto assign form
- [Lihat Semua Penugasan] → goto assignments list
- [Export Review History] → Download report

#### Use Cases:
- Admin wants to see reviewer workload
- Check reviewer contact info
- View review completion rate
- Quick access to edit or assign

---

### 1️⃣1️⃣ Reviewer Assignments
**File**: `11-reviewer-assignments.html`  
**Route**: `/admin/reviewers/:reviewerId/assignments`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header + Sidebar                           │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ Title: Penugasan - Dr. Siti Nurhaliza      │
│ [← Back to Reviewers]                      │
│                                            │
│ Summary:                                   │
│ Total Assigned: 5                          │
│ Completed: 2 | In Progress: 2 | Pending: 1 │
│                                            │
│ Assignment Table:                          │
│ ┌──────┬──────┬──────┬────────┬──────────┐│
│ │ Team │Judul │Rev # │ Status │ Actions  ││
│ ├──────┼──────┼──────┼────────┼──────────┤│
│ │ ...  │ ...  │ #1   │COMPLETE│[Detail]  ││
│ │ ...  │ ...  │ #2   │PENDING │[Unassign]││
│ └──────┴──────┴──────┴────────┴──────────┘│
└────────────────────────────────────────────┘
```

#### Content Details:
- **Summary Stats**: Quick overview
- **Table Columns** (6):
  1. Team Name
  2. Judul Proposal
  3. Reviewer Number: #1 or #2
  4. Review Status: Not Started / In Progress / Completed
  5. Actions:
     - [Lihat Detail] → goto review detail
     - [Batalkan Penugasan] → unassign (if reviewEnabled)

---

### 1️⃣2️⃣ Assign Reviewers Form
**File**: `12-assign-reviewers.html`  
**Route**: `/admin/proposals/:proposalId/assign-reviewers`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header + Sidebar                           │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ Title: Assign Reviewers                    │
│                                            │
│ Proposal Info Box:                         │
│ ┌────────────────────────────────────────┐ │
│ │ Team: Tim Inovasi Digital              │ │
│ │ Judul: Aplikasi Pembelajaran AR        │ │
│ │ Jenis PKM: PKM-KC                      │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Current Assignments:                       │
│ Reviewer 1: [Dropdown: Select reviewer]   │
│   Currently: Dr. Siti Nurhaliza           │
│                                            │
│ Reviewer 2: [Dropdown: Select reviewer]   │
│   Currently: Not assigned                  │
│                                            │
│ ⚠️ Cannot assign same reviewer twice       │
│                                            │
│ [Batal] [Simpan Assignment]                │
└────────────────────────────────────────────┘
```

#### Content Details:
- **Proposal Info**: Context for who is being assigned
- **2 Reviewer Dropdowns**:
  - Option: "-- Select Reviewer --"
  - List all active reviewers
  - Show current workload: "Dr. Siti (5 assignments)"
  - Disable if already selected in other dropdown

#### Validation:
- Cannot assign same reviewer to both slots
- Can assign before or during review phase
- Cannot assign after review phase closed

---

### 1️⃣3️⃣ Review Detail (Admin View)
**File**: `13-review-detail.html`  
**Route**: `/admin/proposals/:proposalId/reviews/:reviewerAssignmentId`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header + Sidebar                           │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ Title: Detail Penilaian                    │
│ Reviewer: Dr. Siti Nurhaliza (Reviewer #1) │
│                                            │
│ 2-Column Layout:                           │
│ ┌──────────────────┬──────────────────┐   │
│ │ LEFT: PDF View   │ RIGHT: Review    │   │
│ │ (read-only)      │ Results          │   │
│ │                  │                  │   │
│ │ [PDF Viewer]     │ Tabs:            │   │
│ │ with annotations │ [Adm] [Sub]      │   │
│ │                  │                  │   │
│ │                  │ Results here     │   │
│ └──────────────────┴──────────────────┘   │
│                                            │
│ Compare with Other Reviewer:               │
│ [Show Reviewer 2 Results]                  │
└────────────────────────────────────────────┘
```

#### Content Details:
- **PDF Viewer (Left)**: Read-only view of proposal with annotations
- **Review Results (Right)**:
  - **Administratif Tab**:
    - Checklist items with checked status
    - Total kesalahan count
    - Catatan/notes
  - **Substantif Tab**:
    - Criteria table with scores (bobot, skor 1-7, nilai)
    - Formula: nilai = bobot × skor
    - Total bobot: 100
    - Total nilai: SUM(all nilai)
    - Catatan/notes
    - Example display:
      ```
      Kriteria              | Bobot | Skor | Nilai
      Gagasan: Orisinalitas | 15    | 6    | = 90
      Gagasan: Penyajian    | 15    | 7    | = 105
      ...
      TOTAL                 | 100          | 625
      ```

- **Compare Feature**: Toggle to show side-by-side comparison if 2 reviewers

---

### 1️⃣4️⃣ Master Data - Prodi
**File**: `14-master-prodi.html`  
**Route**: `/admin/master-data/prodi`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header + Sidebar                           │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ Title: Master Data - Program Studi         │
│                                            │
│ Tabs: [Prodi] [Jurusan] [Jenis PKM]       │
│                                            │
│ [+ Tambah Prodi] (top-right)              │
│                                            │
│ Filter: Jurusan: [Dropdown ▼]             │
│                                            │
│ Prodi Table:                               │
│ ┌────────────┬──────────────┬──────────┐  │
│ │ Jurusan    │ Nama Prodi   │ Actions  │  │
│ ├────────────┼──────────────┼──────────┤  │
│ │ Teknik     │ Informatika  │[Edit][Del]│ │
│ │ Teknik     │ Elektro      │[Edit][Del]│ │
│ │ Ekonomi    │ Manajemen    │[Edit][Del]│ │
│ └────────────┴──────────────┴──────────┘  │
└────────────────────────────────────────────┘
```

#### Content Details:
- **Tab Navigation**: Switch between Prodi/Jurusan/Jenis PKM
- **Table** (3 columns):
  1. Jurusan (grouped)
  2. Nama Prodi
  3. Actions: [Edit] [Delete]

**Add/Edit Modal**:
```
┌─────────────────────────────────────┐
│ Tambah Program Studi                │
│                                     │
│ Jurusan: [Dropdown *]               │
│ Nama Prodi: [Text input *]          │
│                                     │
│ [Batal] [Simpan]                    │
└─────────────────────────────────────┘
```

---

### 1️⃣5️⃣ Master Data - Jurusan
**File**: `15-master-jurusan.html`  
**Route**: `/admin/master-data/jurusan`

#### Layout Structure:
Same structure as Prodi, simpler table.

#### Content Details:
- **Table** (2 columns):
  1. Nama Jurusan
  2. Actions: [Edit] [Delete]

**Add/Edit Modal**:
```
┌─────────────────────────────────────┐
│ Tambah Jurusan                      │
│                                     │
│ Nama Jurusan: [Text input *]        │
│                                     │
│ [Batal] [Simpan]                    │
└─────────────────────────────────────┘
```

#### Business Rules:
- Cannot delete if has prodi associated
- Show confirmation: "Will also delete X prodi"

---

### 1️⃣6️⃣ Master Data - Jenis PKM
**File**: `16-master-jenis-pkm.html`  
**Route**: `/admin/master-data/jenis-pkm`

#### Layout Structure:
Same structure, with more fields.

#### Content Details:
- **Table** (4 columns):
  1. Kode (e.g., PKM-KC)
  2. Nama (e.g., Karsa Cipta)
  3. Deskripsi (truncated)
  4. Actions: [Edit] [Delete]

**Add/Edit Modal**:
```
┌─────────────────────────────────────┐
│ Tambah Jenis PKM                    │
│                                     │
│ Kode: [Text input *]                │
│   Placeholder: "PKM-KC"             │
│                                     │
│ Nama: [Text input *]                │
│   Placeholder: "Karsa Cipta"        │
│                                     │
│ Deskripsi: [Textarea]               │
│                                     │
│ [Batal] [Simpan]                    │
└─────────────────────────────────────┘
```

#### Business Rules:
- Cannot delete if used in teams/proposals
- Kode must be unique

---

### 1️⃣7️⃣ Settings (System Toggles)
**File**: `17-settings-toggles.html`  
**Route**: `/admin/settings`

#### Layout Structure:
```
┌────────────────────────────────────────────┐
│ Header + Sidebar                           │
├────────────────────────────────────────────┤
│ Main Content:                              │
│ Title: System Workflow Control             │
│                                            │
│ Current Phase: REVIEW PHASE (green badge)  │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ Select Active Phase:                   │ │
│ │                                        │ │
│ │ ○ Upload Proposal (Submission Phase)   │ │
│ │   Mahasiswa can submit new proposals   │ │
│ │   Affected: 12 teams in draft          │ │
│ │                                        │ │
│ │ ● Review Period (ACTIVE)               │ │
│ │   Reviewers can review proposals       │ │
│ │   Auto-transition: submitted → under   │ │
│ │   Affected: 18 proposals              │ │
│ │                                        │ │
│ │ ○ Upload Revision Phase                │ │
│ │   Mahasiswa upload revised proposals   │ │
│ │   Auto-transition: reviewed → needs    │ │
│ │   Affected: 3 reviewed proposals      │ │
│ │                                        │ │
│ │ ○ System Closed (None)                 │ │
│ │   All activities paused                │ │
│ │                                        │ │
│ │ [Update Phase]                         │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Phase Change History:                      │
│ - 2026-02-01: SUBMISSION → REVIEW          │
│ - 2026-01-15: CLOSED → SUBMISSION          │
└────────────────────────────────────────────┘
```

#### Content Details:
- **Radio Buttons** (4 options):
  1. **Upload Proposal**: 
     - Enable mahasiswa submission
     - Show count of draft teams
  2. **Review Period**:
     - Enable reviewer access
     - Auto: submitted → under_review
     - Show count affected
  3. **Upload Revision**:
     - Enable revision uploads
     - Auto: reviewed → needs_revision
     - Show count affected
  4. **System Closed**:
     - Pause all activities
     - Maintenance mode

- **Confirmation Modal** (before toggling):
```
┌─────────────────────────────────────┐
│ Activate Review Phase?              │
│                                     │
│ This will:                          │
│ ✓ Auto-transition 18 proposals:    │
│   submitted → under_review          │
│ ✓ Auto-turn OFF Upload Proposal    │
│ ✓ Enable reviewers to submit        │
│                                     │
│ Proceed?                            │
│ [Cancel] [Confirm Activation]       │
└─────────────────────────────────────┘
```

#### Business Rules:
- **Only ONE can be active** (radio behavior)
- Auto-exclusive: selecting one = disable others
- Show confirmation with impact count
- Log all phase changes (audit trail)

---

## 🎨 Design Consistency

### Common Elements Across All Pages:

1. **Header**:
   - Logo (left)
   - Admin label
   - Logout button (right)

2. **Sidebar** (200px fixed):
   - Dashboard
   - Manajemen User
   - Manajemen Team
   - Manajemen Penilaian
   - Manajemen Reviewer
   - Master Data
   - Settings
   - Active state highlighting

3. **Main Content**:
   - Page title (h2)
   - Actions (top-right)
   - Filters (if applicable)
   - Content area
   - Pagination (if applicable)

4. **Modals**:
   - Centered overlay
   - Max-width 600px
   - Form fields
   - Batal + Action buttons

### Color Coding (Low-Fi):
- Borders: #333 (black)
- Backgrounds: #fff (white), #fafafa (light gray), #ddd (medium gray)
- Status badges: Different shades of gray
- Destructive actions: Darker border
- Primary actions: Black background, white text

---

## 📦 File Organization

```
wireframes/
└── admin/
    ├── ADMIN_PAGES_BREAKDOWN.md (this file)
    ├── 01-dashboard.html
    ├── 02-user-list.html
    ├── 03-create-reviewer.html
    ├── 04-team-list.html
    ├── 05-team-detail.html
    ├── 06-team-edit.html
    ├── 07-kriteria-admin.html
    ├── 08-kriteria-substantif.html
    ├── 09-reviewer-list.html
    ├── 10-reviewer-detail.html ⭐ NEW
    ├── 11-reviewer-assignments.html
    ├── 12-assign-reviewers.html
    ├── 13-review-detail.html
    ├── 14-master-prodi.html
    ├── 15-master-jurusan.html
    ├── 16-master-jenis-pkm.html
    └── 17-settings-toggles.html
```

---

## ✅ Next Steps

1. **Review this breakdown** - Apakah sudah sesuai?
2. **Prioritize pages** - Mana yang dibuat duluan?
3. **Start wireframing** - Mulai dari dashboard?
4. **Iterate** - Feedback dan revisi

**Recommendation**: Start with **Dashboard** (01) + **Settings** (16) untuk show overall system control, then drill into management pages.

---

**Total**: 17 halaman HTML wireframe untuk Admin role (termasuk Detail Reviewer)
**Estimated time**: ~3-4 jam untuk semua halaman (jika sequential)
