# Template Prompt untuk Membuat HTML Wireframe Low-Fidelity

## 📋 Template Dasar

```
Buatkan HTML wireframe low-fidelity untuk aplikasi [NAMA APLIKASI].

## Konteks Aplikasi:
[JELASKAN APLIKASI ANDA - tujuan, user roles, fitur utama]

## Halaman yang Dibutuhkan:
1. [Nama Halaman 1] - [deskripsi singkat]
2. [Nama Halaman 2] - [deskripsi singkat]
3. [Nama Halaman 3] - [deskripsi singkat]

## Spesifikasi Wireframe:

### Style Requirements:
- **Low-fidelity**: Gunakan border hitam, background abu-abu/putih
- **No colors**: Hanya grayscale (kecuali untuk status indicators)
- **Box-based**: Setiap komponen dibungkus dalam kotak dengan border
- **Typography**: Arial/sans-serif sederhana
- **Placeholders**: Gunakan [TEXT] atau [IMAGE] untuk placeholder

### Layout Structure:
- Header dengan logo dan user info
- [Deskripsi layout spesifik jika ada]
- Footer [jika diperlukan]

### Components Needed:
- Buttons (bordered, simple)
- Input fields (bordered textboxes)
- Cards/boxes untuk content
- Tables untuk data
- Badges untuk status
- Navigation tabs/menu
- [Komponen lain yang spesifik]

### Interactivity:
- Tab switching untuk navigasi antar halaman
- [Interaksi lain yang dibutuhkan]

## Detail untuk Setiap Halaman:

### 1. [Nama Halaman 1]
**Route**: /path/to/page

**Layout**:
[Jelaskan struktur layout - 2 kolom? sidebar? full width?]

**Components**:
- [Komponen 1]: [deskripsi]
- [Komponen 2]: [deskripsi]

**Data yang ditampilkan**:
- [Field 1]
- [Field 2]

**Actions/Buttons**:
- [Button 1] → [tujuan]
- [Button 2] → [tujuan]

**Business Rules**:
- [Rule 1]
- [Rule 2]

[ULANGI UNTUK SETIAP HALAMAN]

## Technical Requirements:
- Single HTML file (self-contained)
- Inline CSS
- Vanilla JavaScript untuk interactivity
- No external dependencies
- Responsive layout (optional)

## Output:
Buatkan satu file HTML yang bisa langsung dibuka di browser dengan semua halaman yang bisa di-navigate menggunakan tabs/buttons.
```

---

## 🎯 Contoh Prompt Lengkap (PKM Review Case)

```
Buatkan HTML wireframe low-fidelity untuk aplikasi PKM Review System.

## Konteks Aplikasi:
Aplikasi untuk mengelola review proposal Program Kreativitas Mahasiswa (PKM). 
Ada 3 roles: Mahasiswa (buat team & submit proposal), Reviewer (nilai proposal), 
dan Admin (kelola sistem).

## Halaman yang Dibutuhkan:
1. Mahasiswa Dashboard - Lihat team dan status proposal
2. Browse Teams - Cari dan join team lain
3. Detail Team - Kelola team dan upload proposal
4. Reviewer Dashboard - Statistik dan daftar proposal
5. Review Proposal - Form penilaian dengan PDF viewer
6. Admin Dashboard - Manajemen sistem dan toggles

## Spesifikasi Wireframe:

### Style Requirements:
- Low-fidelity: border hitam 2-3px, background #fafafa untuk boxes
- Grayscale only kecuali untuk status badges
- Box-based layout dengan spacing konsisten
- Font: Arial, sans-serif
- Placeholders: [PDF VIEWER], [LOGO], dll

### Layout Structure:
- Header: Logo (kiri) + User info & logout (kanan)
- Content area dengan padding 20px
- Sidebar untuk admin pages
- 2-column layout untuk review page (PDF kiri, form kanan)

### Components Needed:
- Bordered buttons (white bg, black border)
- Primary buttons (black bg, white text)
- Input fields & textareas
- Cards untuk team/proposal display
- Tables untuk data listing
- Badges untuk status (draft, submitted, reviewed)
- Stats boxes untuk metrics
- Tab navigation
- Grid layout (2 columns)

### Interactivity:
- Navigation buttons untuk switch antar halaman
- Active state untuk selected page
- Tab switching dalam 1 halaman

## Detail untuk Setiap Halaman:

### 1. Mahasiswa Dashboard
**Route**: /mahasiswa/dashboard

**Layout**: Full width dengan conditional content

**Scenarios**:
A. Belum punya team:
   - Warning box "Anda belum bergabung dalam team"
   - [+ Buat Team Baru] button
   - [🔍 Cari Team] button
   - Preview team cards (2-3 teams)

B. Sudah punya team:
   - Team info box (nama, judul, status)
   - Stats: Anggota count, review status
   - [Lihat Detail Team] button
   - [Upload Proposal] button (conditional)

**Data yang ditampilkan**:
- Nama team
- Judul proposal
- Jenis PKM (badge)
- Status proposal (badge)
- Jumlah anggota (X/5)
- Progress review

**Business Rules**:
- Mahasiswa hanya bisa dalam 1 team
- Minimal 3 anggota untuk upload proposal

### 2. Browse Teams
**Route**: /mahasiswa/teams/browse

**Layout**: Full width dengan search/filter di atas, team cards di bawah

**Components**:
- Search box (full width)
- Filter dropdowns: Jenis PKM, Prodi
- Team cards (list, bukan grid)
  - Setiap card: Nama team, judul (preview), jenis PKM, anggota count, ketua, status
  - Actions: [Lihat Detail] [Request Join]

**Data yang ditampilkan per card**:
- Nama team
- Judul proposal (1 line preview)
- Jenis PKM badge
- Anggota: X/5 (butuh Y anggota)
- Ketua: Nama (Prodi)
- Status: Open to Join ✅

**Actions**:
- [Lihat Detail] → Team preview
- [Request Join] → Modal konfirmasi

### 3. Detail Team
**Route**: /mahasiswa/teams/:teamId

**Layout**: 2 columns (50-50 split)

**Left Column**:
- Box: Team info (nama, judul, PKM, dosen, status)
  - Action: [Edit Data Team]
- Box: Pending Join Requests (jika ada)
  - Cards untuk setiap request
  - Request card: Nama, NIM, prodi, pesan
  - Actions: [✓ Terima] [✗ Tolak]

**Right Column**:
- Box: Anggota Team (3-5 members)
  - Cards untuk setiap member
  - Member card: Nama, NIM, prodi, role badge (KETUA/anggota)
  - Action: [Kick Member] (kecuali ketua)
  - [+ Undang Mahasiswa] button
- Box: Proposal Section
  - Status badge
  - Conditional buttons: [Upload Proposal] / [Upload Revision]
- Box: Hasil Penilaian (gray jika belum ada)

**Business Rules**:
- All members can approve join requests
- Need 3-5 members
- Need dosen pembimbing before upload

### 4. Reviewer Dashboard
**Route**: /reviewer/dashboard

**Layout**: Full width

**Components**:
- Alert box: Review Phase status (green if active, red if closed)
- 4 stat boxes (grid 2x2):
  - Proposal ditugaskan (count)
  - Review selesai (count)
  - Sedang direview (count)
  - Belum dimulai (count)
- [Lihat Daftar Proposal] button (large, primary)
- Preview table: Assigned proposals (3-5 rows)

**Table columns**:
- Team
- Judul Proposal
- Jenis PKM (badge)
- Status Review (badge)
- Actions ([Review] button)

### 5. Review Proposal
**Route**: /reviewer/proposals/:proposalId

**Layout**: 2 columns (60-40 split), fixed height dengan scroll

**Left Column (PDF Viewer)**:
- Placeholder: [PDF DOCUMENT] dengan border dashed
- Page indicator: "Page X of Y"
- Navigation: [← Prev] [Page input] [Next →]
- Annotation tools box:
  - [🖍️ Highlight]
  - [💬 Comment]
  - [🔍 Zoom]
- Info box: Proposal details (team, judul, PKM, anggota, dosen)

**Right Column (Review Form)**:
- Tab navigation: [Administratif] [Substantif]
- Tab 1 - Administratif:
  - Checklist kriteria (5-7 items)
  - Checkbox: "Ada Kesalahan?"
  - Total kesalahan (auto-count, stat box)
  - Catatan textarea
  - Actions: [Simpan Draft] [Submit Final]

- Tab 2 - Substantif:
  - Table: Kriteria | Bobot | Skor | Nilai
  - Each row: Nama kriteria, bobot (×N), input skor, nilai (auto = skor × bobot)
  - Total skor (stat box)
  - Catatan textarea
  - Actions: [Simpan Draft] [Submit Final]

### 6. Admin Dashboard
**Route**: /admin/dashboard

**Layout**: Sidebar (200px fixed) + main content

**Sidebar**:
- Menu items (boxes):
  - Dashboard
  - Manajemen User
  - Manajemen Team
  - Manajemen Penilaian
  - Manajemen Reviewer
  - Settings (Toggles)

**Main Content**:
- Alert box: Current Phase (colored, prominent)
  - Phase name: SUBMISSION/REVIEW/REVISION
  - Toggle status: ● ON / ○ OFF for each toggle
  - [Manage Toggles] button
- Stats grid (2x2):
  - Total Users
  - Total Teams
  - Proposals Submitted
  - Active Reviewers
- Table: Proposal Status Breakdown
  - Columns: Status (badge), Count, Percentage
- Quick Actions buttons:
  - [+ Tambah Reviewer]
  - [Assign Reviewers]
  - [Export Data]

## Technical Requirements:
- Single HTML file
- Inline CSS dengan variables untuk consistency
- JavaScript untuk page switching
- showPage(pageId) function
- All pages in same file, toggle display dengan .active class
- Button navigation dengan active state

## Output:
File HTML yang bisa langsung dibuka di browser dengan 6 halaman yang bisa di-navigate.
```

---

## 💡 Tips untuk Prompt yang Efektif

### 1. **Be Specific tentang Style**
```
❌ "Buat wireframe sederhana"
✅ "Buat wireframe low-fidelity dengan border hitam 2px, background grayscale, 
   no colors kecuali untuk status indicators"
```

### 2. **Jelaskan Layout Structure**
```
❌ "Ada form dan tabel"
✅ "Layout 2 kolom: PDF viewer di kiri (60% width), form review di kanan (40%), 
   dengan fixed height 600px dan scroll per column"
```

### 3. **Detail Components**
```
❌ "Tambahkan tombol"
✅ "Primary button: padding 8px 16px, background #333, color white, border 2px solid #333
   Secondary button: padding 8px 16px, background white, border 2px solid #333"
```

### 4. **Sertakan Business Rules**
```
Contoh:
- Mahasiswa hanya bisa dalam 1 team
- Minimal 3 anggota untuk upload proposal
- Dosen pembimbing REQUIRED sebelum upload
- Review disabled jika toggle OFF
```

### 5. **Berikan Contoh Data**
```
Contoh team card:
- Nama: "Tim Teknologi Hijau"
- Judul: "Sistem Monitoring Energi Terbarukan"
- Jenis PKM: PKM-GT
- Anggota: 3/5 (butuh 2 anggota)
- Ketua: Andi Prasetyo (Teknik Elektro)
```

### 6. **Specify Interactivity**
```
✅ "Button navigation untuk switch halaman menggunakan showPage(pageId) function"
✅ "Tab switching dalam halaman review untuk Administratif/Substantif"
✅ "Active state pada button yang sedang dipilih (background #333, color white)"
```

---

## 🔧 Template Singkat (Quick Version)

Jika Anda sudah punya document spec (seperti page_structure.md), gunakan prompt singkat:

```
Buatkan HTML wireframe low-fidelity untuk [APLIKASI].

Referensi spec: [paste atau attach page_structure.md]

Requirements:
- Low-fidelity style: black borders, grayscale, box-based
- Single HTML file dengan inline CSS & JS
- Navigasi antar halaman dengan buttons
- Halaman yang dibutuhkan: [list 5-7 halaman kunci]

Untuk setiap halaman, ikuti layout dan komponen yang dijelaskan di spec file.
Gunakan placeholder untuk konten ([PDF], [IMAGE], dll).
```

---

## 📚 Prompt Variations

### Untuk High-Fidelity:
```
Ubah "Low-fidelity" menjadi "High-fidelity":
- Gunakan modern color palette
- Tambahkan shadows, gradients
- Better typography (Google Fonts)
- Micro-animations
- Professional spacing
```

### Untuk Mobile:
```
Tambahkan:
- Responsive design (mobile-first)
- Hamburger menu untuk navigation
- Touch-friendly button sizes (min 44px)
- Stack columns vertically di mobile
```

### Untuk Interactive Prototype:
```
Tambahkan:
- Form validation
- Modal dialogs
- Toast notifications
- Loading states
- Error states
```

---

## ✅ Checklist Sebelum Generate

- [ ] Jelaskan konteks aplikasi
- [ ] List semua halaman yang dibutuhkan
- [ ] Spesifikasi style (low-fi vs high-fi)
- [ ] Detail layout untuk setiap halaman
- [ ] List komponen yang dibutuhkan
- [ ] Jelaskan interactivity
- [ ] Sertakan business rules
- [ ] Berikan contoh data
- [ ] Specify technical requirements

---

## 🎓 Learning Path

1. **Start**: Gunakan template lengkap dengan detail maksimal
2. **Iterate**: Lihat hasil, request perubahan spesifik
3. **Refine**: Pelajari pattern yang berhasil
4. **Optimize**: Buat template custom untuk use case Anda
5. **Master**: Bisa generate dengan prompt ringkas tapi presisi

---

Semoga helpful! Anda bisa copy template ini dan customize sesuai kebutuhan project Anda. 🚀
