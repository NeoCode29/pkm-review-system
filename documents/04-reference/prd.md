# Product Requirements Document (PRD)
## Aplikasi Review PKM

![System Overview](C:/Users/kresna/.gemini/antigravity/brain/004b41a4-6535-4038-b8db-6a7b3e140960/uploaded_media_1769958121894.png)

---

## 1. Executive Summary

### 1.1 Background & Problem Statement
Program Kreativitas Mahasiswa (PKM) merupakan program penting di perguruan tinggi yang membutuhkan proses review proposal yang terstruktur dan terstandarisasi. Saat ini, proses review proposal PKM masih dilakukan secara manual atau menggunakan sistem yang belum terintegrasi, menyebabkan:
- Kesulitan dalam tracking progress review
- Tidak ada standarisasi penilaian administrasi dan substansi
- Proses revisi dan feedback tidak terorganisir
- Monitoring yang sulit bagi administrator

### 1.2 Product Vision
Membangun aplikasi web-based yang menyediakan platform terintegrasi **dengan kontrol workflow berbasis toggle system** untuk mahasiswa mengumpulkan proposal PKM mereka dalam team **(maksimal 1 tim per mahasiswa)**, reviewer melakukan penilaian administrasi dan substansi secara terstruktur **dengan sistem penilaian terpisah** dan fitur annotation PDF, serta admin melakukan monitoring, pengelolaan reviewer, dan kontrol fase review secara efisien.

### 1.3 Goals & Objectives
- Menyederhanakan proses pengumpulan proposal PKM oleh mahasiswa dalam bentuk team (3-5 orang)
- Menyediakan sistem penilaian terstruktur untuk reviewer (penilaian administrasi checklist + penilaian substansi berbasis skor)
- Memfasilitasi proses revisi dengan fitur PDF annotation dan highlight
- Memberikan visibility dan monitoring tools untuk admin
- Meningkatkan kualitas dan konsistensi review proposal PKM

### 1.4 Success Metrics
- Tingkat adopsi: >80% mahasiswa menggunakan sistem untuk submit proposal
- Efisiensi review: Waktu rata-rata review berkurang 30% dibanding proses manual
- User satisfaction: >4.0/5.0 untuk mahasiswa dan reviewer
- System uptime: >99.5%

---

## 2. Target Users & Roles

### 2.1 Mahasiswa (Student)
**Deskripsi**: Pengguna utama yang membuat team, mengumpulkan proposal PKM, dan melakukan revisi berdasarkan feedback reviewer.

**Karakteristik**:
- Bekerja dalam team 3-5 orang
- Memerlukan feedback yang jelas untuk perbaikan proposal
- Perlu visibility terhadap status dan hasil review

**Pain Points**:
- Sulit koordinasi team dalam pengumpulan proposal
- Tidak jelas bagaimana proposal dinilai
- Feedback tidak terstruktur

### 2.2 Reviewer/Dosen (Faculty Reviewer)
**Deskripsi**: Dosen yang ditugaskan oleh admin untuk melakukan review proposal PKM (penilaian administrasi dan substansi).

**Karakteristik**:
- Ahli di bidang tertentu
- Perlu tools untuk memberikan feedback yang jelas
- Menilai multiple proposal

**Pain Points**:
- Kesulitan memberikan feedback yang terstruktur
- Tidak ada fitur untuk marking/highlight di PDF
- Sulit tracking proposal yang sudah/belum direview

### 2.3 Admin (Administrator)
**Deskripsi**: Pengelola sistem yang mengatur user, mengatur indikator penilaian, assign reviewer, dan monitoring progress.

**Karakteristik**:
- Bertanggung jawab atas kelancaran proses review
- Perlu visibility penuh terhadap sistem
- Mengatur konfigurasi dan data master

**Pain Points**:
- Sulit monitoring progress reviewer
- Tidak ada dashboard untuk overview sistem
- Manual assignment reviewer

### 2.4 Dosen Pembimbing (Advisor - Non-User Entity)
**Deskripsi**: Data text (bukan user/akun) yang merepresentasikan dosen pembimbing suatu team.

**Karakteristik**:
- Hanya berupa data (nama, NIDN, email, no HP)
- Tidak memiliki akun login
- Diinput oleh mahasiswa saat membuat team

---

## 3. User Stories & Use Cases

### 3.1 Mahasiswa

#### US-M01: Registrasi Akun
**As a** mahasiswa  
**I want to** register akun dengan data diri saya  
**So that** saya bisa menggunakan sistem untuk submit proposal PKM

**Acceptance Criteria**:
- Mahasiswa dapat register dengan input: Nama, NIM (12 digit angka), Email, Program Studi, Jurusan, No HP, Password
- NIM harus unique (tidak boleh duplikat)
- Email harus unique (tidak boleh duplikat) - digunakan untuk login
- NIM harus 12 digit angka (validasi)
- Setelah register, mahasiswa langsung bisa login tanpa approval admin

#### US-M02: Login Sistem
**As a** mahasiswa  
**I want to** login menggunakan email dan password  
**So that** saya bisa akses sistem

**Acceptance Criteria**:
- Mahasiswa login menggunakan **Email** (bukan NIM) sebagai username
- Password sesuai dengan yang didaftarkan
- Ada fitur forgot password (admin yang manual reset)

#### US-M03: Membuat Team
**As a** mahasiswa  
**I want to** membuat team baru dengan mengisi nama team, jenis PKM, dan judul proposal  
**So that** saya bisa mengajukan proposal PKM bersama anggota lain

**Acceptance Criteria**:
- Input wajib: Nama Team, Jenis PKM (dropdown dari master data), Judul Proposal
- **Dosen Pembimbing OPSIONAL saat create** (boleh diisi nanti, tapi WAJIB sebelum upload proposal)
- **Toggle "Terbuka untuk Bergabung"** (default: ON)
  - Jika ON: Tim terlihat di halaman Browse Teams
  - Jika OFF: Tim private (hanya invite manual)
- Setelah create, status proposal = **draft**
- Mahasiswa yang create menjadi anggota pertama team (ketua)
- **Mahasiswa hanya bisa membuat/join 1 tim** (database constraint)
- Jika sudah di tim lain: tidak bisa create tim baru

#### US-M04: Join Team
**As a** mahasiswa  
**I want to** search dan request join ke team yang sudah dibuat  
**So that** saya bisa menjadi anggota team tersebut

**Acceptance Criteria**:
- **Mahasiswa hanya bisa join MAKSIMAL 1 TIM** (business rule baru)
- Jika sudah di tim: tidak bisa join/create tim lain
- **Browse Teams page**: Filter/search tim yang terbuka
  - Filter: Jenis PKM, Jurusan/Prodi, Tim dengan slot kosong
  - Search: Nama tim atau judul proposal
  - Hanya tampilkan tim: active, member < 5, "Terbuka untuk Bergabung" = ON, status = draft
- **Kirim join request** dengan pesan opsional (textarea perkenalan)
- **SEMUA anggota tim** bisa approve/reject request (tidak hanya ketua)
- **Join request selalu visible** (tidak auto-hide saat tim penuh)
  - Jika penuh: tampilkan "Tim Penuh (5/5)" 
- Setelah approved: mahasiswa bergabung ke tim
- Setelah join, mahasiswa bisa manage team (upload, edit, etc.)

#### US-M05: Keluar dari Team
**As a** anggota team  
**I want to** keluar dari team  
**So that** saya tidak lagi tergabung dalam team tersebut

**Acceptance Criteria**:
- Mahasiswa bisa keluar dari team kapan saja
- Jika team tinggal <3 orang, team tidak bisa submit proposal
- Jika semua anggota keluar (0 anggota), team otomatis dihapus
- Proposal yang sudah disubmit tetap ada selama minimal 1 anggota masih ada

#### US-M06: Kick Anggota Team
**As a** anggota team  
**I want to** mengeluarkan anggota lain dari team  
**So that** team composition bisa diatur

**Acceptance Criteria**:
- Semua anggota team bisa kick anggota lain (permission sama, tidak tergantung role Ketua/Anggota)
- Setelah di-kick, anggota tersebut tidak lagi di team
- Jika setelah kick team <3 orang, team tidak bisa submit proposal

#### US-M07: Manage Team (Edit Detail)
**As a** anggota team  
**I want to** edit detail team (nama, judul, dosen pembimbing, role anggota)  
**So that** informasi team tetap akurat

**Acceptance Criteria**:
- Semua anggota team bisa edit: Nama Team, Judul Proposal, Dosen Pembimbing
- Semua anggota bisa ubah role (Ketua/Anggota) untuk semua anggota including diri sendiri
- Edit bisa dilakukan kapan saja, bahkan setelah submit proposal
- Untuk Dosen Pembimbing: input Nama, NIDN, Email, No HP
  - Jika nama tidak ada di database dosen, create data baru
  - Jika nama sudah ada, gunakan data existing

#### US-M08: Upload Proposal (Original)
**As a** anggota team  
**I want to** upload file proposal dalam format PDF  
**So that** proposal kami bisa direview

**Acceptance Criteria**:
- Team minimal 3 anggota
- **Dosen Pembimbing WAJIB sudah diisi** (validasi ketat)
  - **Jika kosong: tampilkan error + link ke halaman Edit Tim**
  - Error message: "Dosen pembimbing wajib diisi sebelum upload proposal"
  - Tidak bisa proceed tanpa dosen pembimbing
- File format PDF only
- Max file size 10MB
- Tidak ada batasan jumlah halaman
- **Hanya bisa upload jika toggle "Upload Proposal" = ON**
- Setelah upload, status berubah: **draft** → **submitted**

#### US-M09: Upload Revisi Proposal
**As a** anggota team  
**I want to** upload file revisi proposal setelah mendapat feedback  
**So that** proposal yang sudah diperbaiki tersimpan di sistem

**Acceptance Criteria**:
- Hanya bisa jika admin sudah toggle ON "upload ulang"
- File revisi di-upload ke **proposal revised** (bukan proposal original)
- File original **tetap ada** dan bisa didownload
- File revised untuk **dokumentasi saja** (tidak ada review ulang)
- Review/highlight dari reviewer pada proposal original tetap bisa dilihat
- Status proposal original tetap **Reviewed**
- Status proposal revised berubah dari **Draft** → **Submitted**
- Setelah admin toggle OFF "upload ulang", status proposal revised → **Sudah di Revisi**

#### US-M10: Melihat Hasil Review
**As a** anggota team  
**I want to** melihat hasil review dan highlight dari reviewer  
**So that** saya tahu bagian mana yang perlu diperbaiki

**Acceptance Criteria**:
- **Penilaian Administratif**:
  - Mahasiswa **HANYA melihat jumlah kesalahan** (bukan checklist lengkap)
  - Format: "Jumlah Kesalahan: 3"
  - Catatan dari reviewer (opsional)
  - **TIDAK menampilkan** daftar item checklist individual

- **Penilaian Substantif**:
  - Tampilkan **tabel perhitungan** (bukan hanya skor final)
  - Format tabel:
    ```
    Kriteria              | Bobot | Skor | Nilai
    Gagasan: Orisinalitas | 15    | 6    | = 90
    Gagasan: Penyajian    | 15    | 7    | = 105
    Gagasan: Perbandingan | 10    | 5    | = 50
    Kesesuaian Metode     | 15    | 7    | = 105
    ... (lanjutan kriteria lain)
    TOTAL                 | 100          | 625
    ```
  - **Perhitungan terlihat jelas**: Nilai = Bobot × Skor
  - Total bobot = 100 (constraint)

- **TIDAK ADA total skor gabungan** (administratif + substantif)
- Kedua penilaian ditampilkan **terpisah**
- Mahasiswa bisa lihat highlight/annotation dari kedua reviewer di PDF viewer
- Highlight dari reviewer 1 dan 2 dibedakan (warna atau label)

#### US-M11: Download Proposal
**As a** anggota team  
**I want to** download file proposal yang sudah diupload  
**So that** saya bisa review offline

**Acceptance Criteria**:
- Mahasiswa bisa download **file original** (proposal original)
- Mahasiswa bisa download **file revised** (proposal revised)
- Kedua file tersimpan permanent di system

#### US-M12: Melihat Dashboard Mahasiswa
**As a** mahasiswa  
**I want to** melihat dashboard yang menampilkan list team dan status proposal  
**So that** saya tahu progress proposal saya

**Acceptance Criteria**:
- Dashboard menampilkan:
  - List team yang saya ikuti
  - Detail team (jika sudah join): nama, anggota, judul, jenis PKM, dosen pembimbing
  - Status proposal (Draft, Submitted, Under Review, Reviewed, Sudah di Revisi)
  - Hasil review (jika sudah ada)

---

### 3.2 Reviewer/Dosen

#### US-R01: Login Sistem
**As a** reviewer  
**I want to** login menggunakan username dan password  
**So that** saya bisa akses sistem untuk review proposal

**Acceptance Criteria**:
- Reviewer login dengan custom username (dibuat admin) dan password
- Kredensial didapat secara manual dari admin (tidak ada email notifikasi)

#### US-R02: Melihat Dashboard Reviewer
**As a** reviewer  
**I want to** melihat dashboard list proposal yang harus saya review dan progresnya  
**So that** saya tahu tugas review saya

**Acceptance Criteria**:
- Dashboard menampilkan:
  - List proposal yang di-assign ke saya oleh admin
  - Status review: Belum Direview, Sedang Direview, Sudah Direview
  - Progress: berapa proposal sudah selesai dari total assigned
  - Filter berdasarkan status

#### US-R03: Review Proposal - Penilaian Administrasi
**As a** reviewer  
**I want to** melakukan penilaian administrasi dengan checklist  
**So that** saya bisa menilai kelengkapan teknis proposal

**Acceptance Criteria**:
- Reviewer melihat checklist kriteria administrasi (diatur oleh admin per jenis PKM)
- Reviewer centang setiap kriteria yang tidak terpenuhi (ada kesalahan)
- **Sistem auto-hitung total kesalahan**
- Reviewer bisa tambah catatan (textarea, opsional)
- **Untuk Mahasiswa**:
  - **HANYA tampilkan**: "Jumlah Kesalahan: X"
  - **TIDAK tampilkan**: Daftar item checklist individual
  - Tampilkan: Catatan dari reviewer (jika ada)
- Hasil checklist bisa diedit selama toggle review = ON

#### US-R04: Review Proposal - Penilaian Substansi
**As a** reviewer  
**I want to** memberikan skor untuk setiap indikator penilaian substansi  
**So that** saya bisa menilai kualitas konten proposal

**Acceptance Criteria**:
- Reviewer melihat list indikator penilaian substantif (diatur admin per jenis PKM)
- Setiap indikator memiliki:
  - **Bobot** (angka yang total harus = 100. Contoh: 15, 10, 15, dll)
  - **Range skor** (misal: 1-7, 0-100, dll)
  
**PERHITUNGAN**:
- **Formula**: Nilai = Bobot × Skor
- **Total Nilai**: SUM(semua nilai)

**Contoh** (dari gambar referensi):
```
Kriteria 1: Gagasan (Kreativitas)
  Sub-kriteria A: Gagasan orisinalitas → Bobot 15, Skor [6] → Nilai = 90
  Sub-kriteria B: Penyajian rumusan → Bobot 15, Skor [7] → Nilai = 105
  Sub-kriteria C: Perbandingan riset → Bobot 10, Skor [5] → Nilai = 50

Kriteria 2: Kesesuaian Metode
  → Bobot 15, Skor [7] → Nilai = 105

Kriteria 3: Potensi Program
  Sub-kriteria A: Kontribusi Ilmu → Bobot 10, Skor [6] → Nilai = 60
  Sub-kriteria B: Sintesis Literatur → Bobot 15, Skor [6] → Nilai = 90
  Sub-kriteria C: Kemanfaatan → Bobot 10, Skor [7] → Nilai = 70

Kriteria 4: Penjadwalan Kegiatan
  → Bobot 5, Skor [5] → Nilai = 25

Kriteria 5: Penyusunan Anggaran
  → Bobot 5, Skor [6] → Nilai = 30

TOTAL BOBOT = 100 ✓
TOTAL NILAI = 90 + 105 + 50 + 105 + 60 + 90 + 70 + 25 + 30 = 625
```

**Skala Skor**:
- 1 = Buruk
- 2 = Sangat kurang
- 3 = Kurang
- 5 = Cukup
- 6 = Baik
- 7 = Sangat baik

**Display untuk Reviewer**:
```
No | Kriteria                    | Bobot | Skor | Nilai
1  | Gagasan: Orisinalitas      | 15    | [6]  | = 90
   | Gagasan: Penyajian rumusan | 15    | [7]  | = 105
   | Gagasan: Perbandingan riset| 10    | [5]  | = 50
2  | Kesesuaian Metode          | 15    | [7]  | = 105
...
Total                           | 100          | 625
```

**Keterangan**:
- Bobot ditampilkan TANPA simbol % (jadi "15" bukan "15%")
- Total bobot HARUS = 100 (validasi di backend)
- Validasi: Skor harus dalam range (skorMin - skorMax)
- Semua kriteria harus dinilai
- Bisa edit selama toggle review = ON
- Setelah toggle OFF: review menjadi FINAL (tidak bisa edit)

#### US-R05: Highlight/Annotate PDF
**As a** reviewer  
**I want to** memberikan highlight dan komentar langsung di PDF  
**So that** mahasiswa tahu bagian spesifik yang perlu diperbaiki

**Acceptance Criteria**:
- Reviewer bisa highlight text di PDF viewer
- Reviewer bisa tambah komentar/catatan di bagian tertentu
- Highlight tersimpan dan mahasiswa bisa lihat
- Highlight dari reviewer 1 dan reviewer 2 dibedakan (misal: warna berbeda)
- Highlight bisa diedit/dihapus selama admin belum toggle OFF review

#### US-R06: Edit Review yang Sudah Disubmit
**As a** reviewer  
**I want to** mengedit skor dan checklist yang sudah saya submit  
**So that** saya bisa memperbaiki jika ada kesalahan

**Acceptance Criteria**:
- Reviewer bisa edit skor substansi, checklist administrasi, dan highlight
- Edit hanya bisa dilakukan selama admin belum toggle OFF review
- Setelah admin toggle OFF review, semua review menjadi final (tidak bisa edit)

#### US-R07: Download Proposal
**As a** reviewer  
**I want to** download file proposal  
**So that** saya bisa review offline

**Acceptance Criteria**:
- Reviewer bisa download PDF proposal versi terbaru

#### US-R08: Tidak Bisa Melihat Review Reviewer Lain
**As a** reviewer  
**I want to** review dilakukan secara independen  
**So that** penilaian objektif dan tidak terpengaruh

**Acceptance Criteria**:
- Reviewer TIDAK bisa melihat skor, checklist, atau highlight dari reviewer lain pada proposal yang sama
- Review bersifat blind review antar reviewer

---

### 3.3 Admin

#### US-A01: Login Sistem
**As a** admin  
**I want to** login dengan kredensial admin  
**So that** saya bisa mengelola sistem

#### US-A02: Melihat Dashboard Admin
**As a** admin  
**I want to** melihat dashboard dengan statistik dan overview sistem  
**So that** saya bisa monitoring keseluruhan proses

**Acceptance Criteria**:
- Dashboard menampilkan:
  - Total proposal (breakdown per status)
  - Total team
  - Total mahasiswa
  - Total reviewer/dosen
  - Progress per reviewer (misal: Reviewer A sudah review 5/10 proposal)
  - Breakdown proposal per jenis PKM
  - Grafik/chart untuk visualisasi data

#### US-A03: Manage User - Mahasiswa
**As a** admin  
**I want to** melihat, edit, dan delete data mahasiswa  
**So that** saya bisa mengelola user mahasiswa

**Acceptance Criteria**:
- Admin bisa view list semua mahasiswa
- Admin bisa edit data mahasiswa (nama, email, prodi, jurusan, no HP)
- **Admin bisa delete mahasiswa (hard delete user)**
  - **User dihapus permanent** dari database
  - **Related data TETAP ADA** (team, proposal, review tidak hilang)
  - **Foreign keys SET NULL** (TeamMember.mahasiswaId → NULL)
  - **Display**: Show "[User Deleted]" di UI untuk deleted users
  - **Consequence**: Team tetap ada, proposal tetap ada, tapi member yang deleted tampil sebagai "[User Deleted]"
- Admin bisa reset password mahasiswa (untuk forgot password request)
- Admin TIDAK bisa import data mahasiswa (mahasiswa register sendiri)

#### US-A04: Manage User - Reviewer/Dosen
**As a** admin  
**I want to** create, edit, dan delete akun reviewer  
**So that** reviewer bisa melakukan review

**Acceptance Criteria**:
- **Admin bisa create akun reviewer LANGSUNG** (one-step process)
  - Input: Nama, NIDN, Email, Password, No HP, Program Studi
  - **Otomatis create**: User (role=reviewer) + Profil Reviewer
  - **Tidak ada proses 2 langkah** (buat user → edit role)
  - Transaksi database: Atomic (user + reviewer profile sekaligus)
  
- **FITUR EDIT ROLE DIHAPUS**
  - User memiliki role tetap sejak creation
  - Tidak ada cara untuk mengubah role user
  
- Admin bisa edit data reviewer (nama, NIDN, email, dll)
- **Admin bisa delete reviewer (hard delete user)**
  - **User dihapus permanent** dari database
  - **Reviews TETAP ADA** (review assignment, scores, checklist tidak hilang)
  - **Foreign keys SET NULL** (ReviewAssignment.reviewerId → NULL)
  - **Display**: Show "[Reviewer Deleted]" di UI
  - **Consequence**: Review results tetap ada dan valid, tapi reviewer name tampil sebagai "[Reviewer Deleted]"
- Kredensial diberikan manual ke reviewer (tidak ada email notif)

#### US-A05: Manage Data Master - Jenis PKM
**As a** admin  
**I want to** CRUD data jenis PKM  
**So that** sistem support berbagai jenis PKM

**Acceptance Criteria**:
- Admin bisa tambah jenis PKM (misal: PKM-RE, PKM-RSH, PKM-PM, PKM-KC, PKM-AI, PKM-GFT, PKM-K)
- Admin bisa edit dan delete jenis PKM
- Setiap jenis PKM punya kriteria penilaian berbeda (indikator administrasi dan substansi)

#### US-A06: Manage Data Master - Jurusan & Program Studi
**As a** admin  
**I want to** CRUD data Jurusan dan Program Studi  
**So that** mahasiswa bisa pilih saat register

**Acceptance Criteria**:
- Admin bisa tambah, edit, delete Jurusan
- Admin bisa tambah, edit, delete Program Studi
- Ada relasi: 1 Jurusan punya banyak Program Studi
- Saat tambah Prodi, admin pilih Jurusan parent

#### US-A07: Manage Indikator Penilaian - Administrasi
**As a** admin  
**I want to** mengatur checklist kriteria administrasi per jenis PKM  
**So that** reviewer punya panduan penilaian yang jelas

**Acceptance Criteria**:
- Admin bisa tambah kriteria administrasi untuk setiap jenis PKM
- Contoh: "Margin tidak sesuai (Top: 3cm, Left: 4cm, Right: 3cm, Bottom: 3cm)", "Jumlah halaman tidak sesuai (Max: 15 halaman)", dll
- Admin bisa edit dan delete kriteria
- Kriteria bersifat checklist (ada/tidak ada kesalahan)

#### US-A08: Manage Indikator Penilaian - Substansi
**As a** admin  
**I want to** mengatur indikator penilaian substansi per jenis PKM  
**So that** reviewer bisa memberikan skor yang terstruktur

**Acceptance Criteria**:
- Admin bisa tambah indikator substantif untuk setiap jenis PKM
- Contoh indikator: "Kreativitas - Gagasan Orisinalitas", "Kesesuaian Metode", "Potensi Program", dll
- Untuk setiap indikator, admin set:
  - **Nama kriteria**
  - **Deskripsi**
  - **Bobot** (angka yang total harus = 100)
  - **Skor min** (misal: 1)
  - **Skor max** (misal: 7)
  - **Urutan** (untuk display)

**Validasi Bobot - PENTING**:
- **Total bobot untuk setiap jenis PKM HARUS = 100**
- Bobot ditampilkan TANPA simbol % (jadi "15" bukan "15%")
- Input: `<input type="number" min="1" max="100" placeholder="Contoh: 15" />`
- Sistem validasi: `SUM(bobot semua kriteria) === 100`
- Jika tidak = 100: tampilkan error "Total bobot harus 100"

**Contoh Setup Admin untuk PKM-KC**:
```
Kriteria 1: Gagasan - Orisinalitas
  Bobot: 15
  Skor Min: 1, Skor Max: 7

Kriteria 2: Gagasan - Penyajian Rumusan
  Bobot: 15
  Skor Min: 1, Skor Max: 7

Kriteria 3: Gagasan - Perbandingan Riset
  Bobot: 10
  Skor Min: 1, Skor Max: 7

... (lanjutan)

Total Bobot: 100 ✓ (valid)
```

**Display Info Perhitungan**:
```
Contoh: Jika reviewer beri skor 6
Nilai = Bobot × Skor = 15 × 6 = 90
```

- Admin bisa edit dan delete indikator
- Saat edit bobot: sistem auto-cek apakah total = 100
- Warning jika total ≠ 100 sebelum save

#### US-A09: Upload Template Proposal (Optional)
**As a** admin  
**I want to** upload template proposal untuk mahasiswa  
**So that** mahasiswa punya panduan format proposal

**Acceptance Criteria**:
- Admin bisa upload file template (PDF/Word) per jenis PKM
- Template bersifat optional (boleh ada atau tidak)
- Mahasiswa bisa download template dari sistem

#### US-A10: Toggle Pengumpulan Proposal
**As a** admin  
**I want to** mengatur apakah mahasiswa bisa submit proposal atau tidak  
**So that** saya bisa kontrol periode pengumpulan

**Acceptance Criteria**:
- Admin punya toggle "Pengumpulan Proposal" (global untuk semua proposal)
- Toggle ON = mahasiswa bisa submit proposal
- Toggle OFF = mahasiswa tidak bisa submit proposal
- Toggle ini tidak mempengaruhi status proposal

#### US-A11: Assign Reviewer ke Proposal
**As a** admin  
**I want to** assign 2 reviewer untuk setiap proposal  
**So that** proposal bisa direview

**Acceptance Criteria**:
- Admin bisa assign manual 2 reviewer untuk 1 proposal
- Admin bisa bulk/mass assign reviewer ke multiple proposal
- Ada filter berdasarkan jenis PKM untuk bulk assignment
- Tidak ada filter lain (status, dll)
- Reviewer langsung di-assign (tidak bisa tolak assignment)

#### US-A12: Toggle Review
**As a** admin  
**I want to** mengontrol periode review  
**So that** reviewer bisa mulai dan berhenti review pada waktu yang tepat

**Acceptance Criteria**:
- Admin punya toggle "Review" (global untuk semua proposal)
- **Toggle ON** = Memulai review
  - Status semua proposal **Submitted** → **Under Review**
  - Reviewer bisa mulai melakukan review
- **Toggle OFF** = Mengakhiri review
  - Status semua proposal **Under Review** → **Reviewed**
  - Reviewer tidak bisa edit review lagi (final)
- Toggle ini independent dari toggle pengumpulan

#### US-A13: Toggle Upload Ulang
**As a** admin  
**I want to** mengatur apakah mahasiswa bisa upload ulang (revisi) proposal  
**So that** saya bisa kontrol periode revisi

**Acceptance Criteria**:
- Admin punya toggle "Upload Ulang" (global)
- **Toggle ON** = Mahasiswa bisa upload revisi
  - Mahasiswa bisa upload file baru (file lama tetap ada sebagai versi sebelumnya)
  - Review/highlight dari reviewer tetap ada
- **Toggle OFF** = Mahasiswa tidak bisa upload lagi
  - Status semua proposal yang sudah upload revisi → **Sudah di Revisi**
  - Proses selesai (tidak ada review ulang)

#### US-A14: View & Download Proposal
**As a** admin  
**I want to** melihat dan download semua proposal  
**So that** saya bisa monitoring konten proposal

**Acceptance Criteria**:
- Admin bisa lihat list semua proposal
- Admin bisa view detail proposal (team, reviewer, status, review result)
- Admin bisa download file proposal versi terbaru (revisi)
- Admin tidak bisa download versi lama

#### US-A15: Edit/Delete Proposal
**As a** admin  
**I want to** edit atau delete proposal  
**So that** saya bisa maintain data integrity

**Acceptance Criteria**:
- Admin bisa edit detail proposal (nama team, judul, jenis PKM, dll)
- Admin bisa delete proposal
- Admin TIDAK bisa edit/delete review/skor yang sudah diberikan reviewer

#### US-A16: Delete Team
**As a** admin  
**I want to** delete team  
**So that** saya bisa cleanup data yang tidak valid

**Acceptance Criteria**:
- **Admin bisa delete team KAPAN SAJA** (tidak ada restriksi berdasarkan status)
- **Bisa delete meskipun**:
  - Proposal sudah submitted
  - Sedang di-review
  - Sudah ada review
  
**Konfirmasi Kuat Diperlukan**:
- Modal konfirmasi menampilkan cascade impact
- Format: 
  ```
  PERINGATAN: Ini akan menghapus:
  - Team beserta 5 anggota
  - 1 proposal
  - 2 review yang sudah dibuat
  
  Aksi ini TIDAK BISA DIBATALKAN!
  ```
- Button: [Batal] [Ya, Hapus Permanen]

**Cascade Delete**:
- Team
- Team members
- Proposals (semua type)
- Reviews
- Annotations
- Join requests

**Audit Log**: Catat siapa, kapan, tim apa yang dihapus

#### US-A17: Monitoring Progress Reviewer
**As a** admin  
**I want to** melihat progress penilaian setiap reviewer  
**So that** saya bisa ensure semua proposal direview tepat waktu

**Acceptance Criteria**:
- Admin bisa lihat list reviewer dan jumlah proposal assigned
- Admin bisa lihat berapa proposal sudah direview vs belum
- Admin bisa lihat detail proposal per reviewer

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

#### FR-AUTH-001: User Registration (Mahasiswa)
- Mahasiswa dapat self-register dengan input: Nama, NIM, Email, Prodi, Jurusan, No HP, Password
- Validasi: NIM unique, Email unique, NIM 12 digit angka
- Tidak perlu approval admin
- Langsung bisa login setelah register

#### FR-AUTH-002: User Login
- Mahasiswa login dengan **Email** (username) + Password
- Reviewer login dengan Email + Password (atau Custom Username)
- Admin login dengan Admin Credentials
- Session management dengan timeout
- Authentication menggunakan Supabase Auth

#### FR-AUTH-003: Forgot Password
- Mahasiswa bisa request forgot password
- Admin yang manual reset password
- Tidak ada email notifikasi

#### FR-AUTH-004: Role-Based Access Control (RBAC)
- 3 roles: Mahasiswa, Reviewer, Admin
- Permission sesuai dengan role
- Mahasiswa hanya bisa akses team yang diikuti

---

### 4.2 Team Management

#### FR-TEAM-001: Create Team
- Input: Nama Team, Jenis PKM, Judul Proposal
- Dosen Pembimbing optional saat create
- Creator menjadi anggota pertama
- Initial status: **Draft**

#### FR-TEAM-002: Join Team
- Mahasiswa search team dan send request
- Anggota existing bisa accept/reject
- Auto reject jika sudah 5 anggota
- Semua anggota punya permission sama (bisa manage team)

#### FR-TEAM-003: Leave Team
- Mahasiswa bisa keluar dari team
- Team auto delete jika 0 anggota
- Team tidak bisa submit jika <3 anggota

#### FR-TEAM-004: Kick Member
- Semua anggota bisa kick anggota lain (tidak ada privilege khusus untuk Ketua)

#### FR-TEAM-005: Edit Team Detail
- Bisa edit: Nama Team, Judul Proposal, Dosen Pembimbing
- Bisa ubah role anggota (Ketua/Anggota) - hanya label, tidak ada perbedaan permission
- Bisa edit kapan saja, termasuk setelah submit

#### FR-TEAM-006: Dosen Pembimbing Management
- Input: Nama, NIDN, Email, No HP
- Jika nama belum ada di tabel dosen, create new
- Jika nama sudah ada, use existing data
- Dosen Pembimbing bukan user (tidak bisa login)

---

### 4.3 Proposal Management

#### FR-PROP-001: Upload Proposal (Original)
- Minimum 3 anggota di team
- Dosen Pembimbing wajib diisi
- Format: PDF only
- Max size: 10MB
- No page limit
- Create **proposal original** (type: original)
- Status proposal original: **Draft** → **Submitted**
- Sistem auto-create **proposal revised** (type: revised) dengan status **Draft**

#### FR-PROP-002: Upload Proposal Revised
- Hanya bisa jika admin toggle ON "upload ulang"
- File revisi di-upload ke **proposal revised** (type: revised)
- File original **tetap ada** di proposal original (permanent storage)
- Total 2 files: 1 original + 1 revised (permanent)
- **Proposal revised TIDAK di-review** (hanya untuk dokumentasi)
- Review/highlight pada proposal original tetap ada dan bisa dilihat
- Status proposal original: tetap **Reviewed** (tidak berubah)
- Status proposal revised: **Draft** → **Submitted** (saat upload)
- Setelah admin toggle OFF "upload ulang", status proposal revised → **Sudah di Revisi**

#### FR-PROP-003: Proposal Status Workflow

**Proposal Original** (type: original) - Gets reviewed:
1. **Draft**: Team created, no file yet
2. **Submitted**: File uploaded by team
3. **Under Review**: Admin toggle ON review
4. **Reviewed**: Admin toggle OFF review (final)

**Proposal Revised** (type: revised) - For documentation only:
1. **Draft**: Auto-created when original uploaded, OR after original reviewed
2. **Submitted**: Revised file uploaded by team (requires admin toggle ON "upload ulang")
3. **Sudah di Revisi**: Admin toggle OFF "upload ulang" (end state)

**Key Rules**:
- Only **proposal original** gets reviewed (2 reviewers)
- **Proposal revised** is for documentation only (NO review)
- 1 team = 2 proposals (original + revised)

#### FR-PROP-004: Download Proposal
- Mahasiswa bisa download **proposal original** dan **proposal revised**
- Reviewer bisa download **proposal original** (yang di-review)
- Admin bisa download **proposal revised** (final/revised version)
- Admin juga bisa download **proposal original** jika diperlukan

---

### 4.4 Review & Assessment

#### FR-REV-001: Reviewer Assignment
- Admin assign 2 reviewer per **proposal original** (NOT proposal revised)
- Manual assignment atau bulk assignment
- Filter: Jenis PKM
- Reviewer langsung assigned (tidak bisa tolak)
- Same 2 reviewers for entire team (tidak berubah pada proposal revised)

#### FR-REV-002: Administrative Assessment (Checklist)
- Reviewer centang kriteria yang tidak terpenuhi
- Checklist items diatur admin per jenis PKM
- Dinamis (admin bisa tambah/edit/delete kriteria)
- Bisa edit selama admin belum toggle OFF review

#### FR-REV-003: Substantive Assessment (Scoring)
- Reviewer input skor per indikator
- Indikator dan range skor diatur admin per jenis PKM
- Dinamis (admin bisa tambah/edit/delete indikator)
- Total skor dihitung otomatis
- Bisa edit selama admin belum toggle OFF review

#### FR-REV-004: PDF Annotation & Highlighting
- Reviewer bisa highlight text di PDF viewer
- Reviewer bisa tambah comment/note di bagian tertentu
- Annotation tersimpan di database
- Mahasiswa bisa lihat highlight dari kedua reviewer
- Highlight dari reviewer 1 dan 2 dibedakan (warna atau label)
- Bisa edit selama admin belum toggle OFF review

#### FR-REV-005: Review Scoring Aggregation
- **Substansi**: Rata-rata skor dari 2 reviewer
- **Administrasi**: Gabungan checklist dari 2 reviewer (jika salah satu reviewer centang error, maka ditampilkan sebagai error)

#### FR-REV-006: Independent/Blind Review
- Reviewer tidak bisa lihat review dari reviewer lain
- Review bersifat independent untuk objektifitas

---

### 4.5 Admin Configuration

#### FR-CFG-001: Manage Assessment Indicators - Administrative
- Admin CRUD kriteria administrasi per jenis PKM
- Kriteria berupa checklist (contoh: margin, halaman, struktur)
- Dinamis dan configurable

#### FR-CFG-002: Manage Assessment Indicators - Substantive
- Admin CRUD indikator substansi per jenis PKM
- Setiap indikator punya range skor (configurable)
- Dinamis dan configurable
- Contoh: Originalitas (0-20), Metodologi (0-30), dll

#### FR-CFG-003: Manage Master Data - PKM Type
- Admin CRUD jenis PKM
- Support: PKM-RE, PKM-RSH, PKM-PM, PKM-KC, PKM-AI, PKM-GFT, PKM-K, dll
- Bisa custom jenis baru

#### FR-CFG-004: Manage Master Data - Department & Study Program
- Admin CRUD Jurusan dan Program Studi
- Relasi: 1 Jurusan : Many Prodi

#### FR-CFG-005: Toggle Controls (Global)
Tiga toggle independen:
1. **Toggle Pengumpulan**: ON = mahasiswa bisa submit, OFF = tidak bisa submit
2. **Toggle Review**: ON = mulai review (Submitted → Under Review), OFF = akhiri review (Under Review → Reviewed)
3. **Toggle Upload Ulang**: ON = mahasiswa bisa upload revisi, OFF = tidak bisa upload + status → Sudah di Revisi

#### FR-CFG-006: Template Upload (Optional)
- Admin bisa upload template proposal per jenis PKM
- Mahasiswa bisa download template
- Optional feature

---

### 4.6 Dashboard & Monitoring

#### FR-DASH-001: Mahasiswa Dashboard
Display:
- List team yang diikuti
- Detail team (nama, anggota, judul, jenis PKM, dosen pembimbing)
- Status proposal
- Hasil review (skor, checklist, highlight)

#### FR-DASH-002: Reviewer Dashboard
Display:
- List proposal assigned to reviewer
- Progress: X/Y proposal sudah direview
- Filter berdasarkan status review

#### FR-DASH-003: Admin Dashboard
Display:
- Total proposal (breakdown per status)
- Total team
- Total mahasiswa
- Total reviewer
- Progress per reviewer (misal: Reviewer A: 5/10 done)
- Breakdown per jenis PKM
- Charts/graphs untuk visualisasi

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **Page Load Time**: < 3 detik untuk page load
- **PDF Viewer Performance**: < 5 detik untuk load PDF 10MB
- **Concurrent Users**: Support minimum 500 concurrent users
- **Database Query**: < 1 detik untuk query response

### 5.2 Scalability
- Support minimum 5,000 mahasiswa
- Support minimum 100 reviewer
- Support minimum 1,000 proposal per periode
- Horizontal scaling capability

### 5.3 Reliability & Availability
- **Uptime**: 99.5% availability
- **Data Backup**: Daily automated backup
- **Disaster Recovery**: Recovery Time Objective (RTO) < 4 hours

### 5.4 Security
- **Authentication**: Secure password hashing (bcrypt minimum)
- **Authorization**: Role-based access control
- **Data Encryption**: HTTPS for data in transit
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Input sanitization
- **File Upload Validation**: Validate file type dan size sebelum upload

### 5.5 Usability
- **Responsive Design**: Support desktop, tablet, mobile
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **User Interface**: Intuitive, modern, minimal training required
- **Accessibility**: WCAG 2.1 Level AA compliance

### 5.6 Maintainability
- **Code Quality**: Follow coding standards and best practices
- **Documentation**: Comprehensive technical documentation
- **Logging**: Centralized logging for debugging
- **Monitoring**: Application performance monitoring (APM)

---

## 6. Business Rules & Validation

### 6.1 User Validation Rules
- **NIM**: Exactly 12 digits, numeric only, unique (for data integrity, NOT for login)
- **Email**: Valid email format, unique (used for login authentication)
- **Password**: Minimum 8 characters (recommended)
- **No HP**: Numeric with minimum length

### 6.2 Team Rules
- Minimum 3 anggota untuk submit proposal
- Maximum 5 anggota
- Team auto delete jika 0 anggota
- Dosen Pembimbing wajib sebelum submit
- Semua anggota punya permission yang sama (tidak ada privilege khusus untuk Ketua)

### 6.3 Proposal Rules
- Format: PDF only
- Max size: 10MB
- No page limit
- **1 team = 2 proposals**: proposal original (reviewed) + proposal revised (documentation)
- **Proposal original** di-review oleh 2 reviewers
- **Proposal revised** TIDAK di-review (hanya dokumentasi)
- File original dan revised **permanent storage** (both kept)
- Upload revised hanya bisa jika admin toggle ON "upload ulang"

### 6.4 Review Rules
- 2 reviewer per **proposal original** (proposal revised tidak di-review)
- Review dilakukan **hanya 1x** pada proposal original
- Reviewer tidak bisa lihat review dari reviewer lain (blind review)
- Reviewer bisa edit review selama admin belum toggle OFF review
- Admin tidak bisa edit/delete review yang sudah dibuat reviewer
- Substansi: rating rata-rata dari 2 reviewer
- Administrasi: gabungan checklist (union of errors)
- Review results tetap visible pada proposal original selamanya

### 6.5 Status Transition Rules

**Proposal Original** (gets reviewed):
```
Draft → Submitted: Mahasiswa upload file original
Submitted → Under Review: Admin toggle ON review  
Under Review → Reviewed: Admin toggle OFF review (FINAL - tidak berubah lagi)
```

**Proposal Revised** (documentation only):
```
Draft: Auto-created saat proposal original uploaded
Draft → Submitted: Mahasiswa upload file revised (toggle upload ulang ON)
Submitted → Sudah di Revisi: Admin toggle OFF upload ulang (END STATE)
```

**Key Points**:
- Proposal original di-review, status final di **Reviewed**
- Proposal revised TIDAK di-review, status final di **Sudah di Revisi**
- 2 proposals run independently with own status

### 6.6 Toggle Rules
- **Toggle Pengumpulan**: Global, ON = mahasiswa bisa upload **proposal original**, OFF = tidak bisa upload
- **Toggle Review**: Global, ON = mulai review **proposal original** (Submitted → Under Review), OFF = akhiri review (Under Review → Reviewed)
- **Toggle Upload Ulang**: Global, ON = mahasiswa bisa upload **proposal revised**, OFF = tidak bisa upload + status proposal revised → Sudah di Revisi
- Ketiga toggle independent (tidak saling bergantung)
- Toggle hanya mempengaruhi proposal type yang sesuai (original vs revised)

---

## 7. Data Model Overview

### 7.1 Core Entities

#### User
- **Mahasiswa**: id, nim (unique), nama, email (unique), password_hash, prodi_id, jurusan_id, no_hp, created_at
- **Reviewer**: id, username (unique), nama, nidn, email, no_hp, password_hash, created_at
- **Admin**: id, username, password_hash, created_at

#### Team
- id, nama_team, jenis_pkm_id, judul_proposal, dosen_pembimbing_id, status, created_at, updated_at

#### TeamMember
- id, team_id, mahasiswa_id, role (Ketua/Anggota), joined_at

#### DosenPembimbing (Non-User, Text Data Only)
- id, nama, nidn, email, no_hp, created_at
- **NOT a user account** (cannot login)
- Mahasiswa input saat create/edit team
- Separate from `reviewer_user` table

#### Proposal
- id, team_id, **type** (original/revised), status (Draft, Submitted, Under Review, Reviewed, Sudah di Revisi), created_at, updated_at
- **1 team = 2 proposals**: 1 original + 1 revised
- UNIQUE constraint (team_id, type)
- Only **original** gets reviewed

#### ProposalFile
- id, proposal_id, file_path, file_size, uploaded_at, uploaded_by
- Each proposal (original and revised) can have their own file
- Both files stored **permanently** (2 total)
- No version field needed (proposal type distinguishes original vs revised)

#### ReviewAssignment
- id, proposal_id, reviewer_id, assigned_at

#### AdministrativeReview
- id, review_assignment_id, checklist_item_id, is_error (boolean), updated_at

#### SubstantiveReview
- id, review_assignment_id, indicator_id, score, updated_at

#### PDFAnnotation
- id, proposal_file_id, reviewer_id, type (highlight/comment), page_number, coordinates (JSON), text, color, created_at, updated_at

#### Master Data
- **JenisPKM**: id, nama, kode, created_at
- **Jurusan**: id, nama, created_at
- **ProgramStudi**: id, jurusan_id, nama, created_at
- **AdministrativeChecklistItem**: id, jenis_pkm_id, description, created_at
- **SubstantiveIndicator**: id, jenis_pkm_id, name, min_score, max_score, weight, created_at

#### Configuration
- **SystemConfig**: id, key, value (JSON), description

---

## 8. User Interface Requirements

### 8.1 Design Principles
- **Clean & Modern**: Minimalist design dengan hierarki yang jelas
- **Responsive**: Mobile-first design
- **Consistent**: Consistent color scheme, typography, spacing
- **Accessible**: High contrast, keyboard navigation, screen reader friendly

### 8.2 Key Pages/Screens

#### Mahasiswa
1. **Login/Register Page**
2. **Dashboard**: List team, status, hasil review
3. **Team Management**: Create, join, manage team
4. **Proposal Upload**: Upload PDF dengan progress indicator
5. **Review Result Page**: View skor, checklist, PDF dengan highlight

#### Reviewer
1. **Login Page**
2. **Dashboard**: List assigned proposal, progress tracker
3. **Review Page**: PDF viewer + annotation tools + form penilaian (checklist + scoring)
4. **Review Summary**: Overview semua review

#### Admin
1. **Login Page**
2. **Dashboard**: Statistics, charts, progress monitoring
3. **User Management**: CRUD mahasiswa dan reviewer
4. **Master Data Management**: CRUD Jenis PKM, Jurusan, Prodi
5. **Assessment Configuration**: Manage criteria administrasi dan indikator substansi per jenis PKM
6. **Reviewer Assignment**: Assign reviewer dengan bulk action dan filter
7. **Toggle Controls**: Toggle pengumpulan, review, upload ulang
8. **Proposal Monitoring**: View semua proposal, detail, download

### 8.3 PDF Viewer Requirements
- Display PDF dengan zoom, page navigation
- Highlight tool dengan color picker
- Comment/note tool
- Save annotation ke database
- Display annotation dari multiple reviewer dengan visual distinction
- Responsive untuk berbagai ukuran screen

---

## 9. Technical Stack Recommendations

### 9.1 Frontend
- **Framework**: Next.js (React) untuk modern web app
- **UI Library**: Shadcn/ui atau Material-UI untuk component library
- **PDF Viewer**: PDF.js atau React-PDF untuk PDF rendering
- **PDF Annotation**: Annotorious, PDF.js annotation layer, atau custom implementation
- **State Management**: React Context API atau Zustand
- **Styling**: Tailwind CSS untuk utility-first CSS

### 9.2 Backend
- **Framework**: Next.js API Routes, Express.js, atau NestJS
- **Database**: PostgreSQL untuk relational data
- **ORM**: Prisma atau TypeORM
- **File Storage**: AWS S3, Google Cloud Storage, atau local storage dengan CDN
- **Authentication**: NextAuth.js, Passport.js, atau custom JWT implementation

### 9.3 Infrastructure
- **Hosting**: Vercel, AWS, Google Cloud Platform, atau Azure
- **Database Hosting**: Managed PostgreSQL (AWS RDS, Google Cloud SQL, Supabase)
- **File Storage**: S3-compatible storage
- **CDN**: CloudFlare, AWS CloudFront

---

## 10. Out of Scope (Phase 1)

Fitur-fitur berikut **TIDAK** termasuk dalam scope Phase 1:
- Email/Push notification
- Export/Import data mahasiswa (mahasiswa register sendiri)
- Export laporan/report (tidak ada fitur export)
- Sistem approval/rejection proposal (hanya review, tidak ada keputusan lulus/tidak)
- Period/Batch management (semua proposal dalam satu pool)
- Multiple cycles revisi (hanya 1 cycle: Review → Revisi → Selesai)
- File version comparison
- History/log file upload
- Integration dengan sistem eksternal (SSO, API lain)
- Mobile app native (hanya web responsive)
- Advanced analytics/BI dashboard

---

## 11. Implementation Phases

### Phase 1: MVP (Minimum Viable Product)
**Timeline**: 8-12 minggu
- User authentication & authorization (3 roles)
- Team management (create, join, manage)
- Proposal upload (PDF only)
- Basic PDF viewer
- Reviewer assignment (manual & bulk)
- Review form (checklist + scoring)
- Basic dashboard untuk semua role
- Toggle controls (pengumpulan, review, upload ulang)
- Admin configuration (master data, indikator)

### Phase 2: Annotation & Enhancement
**Timeline**: 4-6 minggu
- PDF annotation & highlighting
- Advanced PDF viewer
- UI/UX polish
- Performance optimization
- Comprehensive testing

### Phase 3: Monitoring & Reporting
**Timeline**: 3-4 minggu
- Enhanced admin dashboard dengan charts
- Detailed progress monitoring
- System optimization
- Documentation

---

## 12. Success Criteria

### 12.1 Functional Success
- ✅ Mahasiswa bisa register, create team, upload proposal
- ✅ Reviewer bisa melakukan penilaian administrasi dan substansi
- ✅ Reviewer bisa annotate PDF
- ✅ Admin bisa assign reviewer, manage master data, control toggle
- ✅ Workflow status transition berjalan sesuai business rules
- ✅ Review hasil ditampilkan dengan benar (substansi rata-rata, administrasi gabungan)

### 12.2 Non-Functional Success
- ✅ System uptime >99.5%
- ✅ Page load time <3 detik
- ✅ Support 500 concurrent users
- ✅ Mobile responsive
- ✅ Security compliance (HTTPS, password hashing, input validation)

### 12.3 User Acceptance
- ✅ User satisfaction >4.0/5.0 (survey post-implementation)
- ✅ Adoption rate >80% dari target users
- ✅ Minimal training required (<2 jam untuk onboarding)

---

## 13. Risks & Mitigation

### Risk 1: PDF Annotation Complexity
**Impact**: High | **Probability**: Medium
- **Mitigation**: Use proven libraries (PDF.js, Annotorious), prototype early, allocate sufficient time for testing

### Risk 2: Performance with Large PDFs
**Impact**: Medium | **Probability**: Medium
- **Mitigation**: Implement lazy loading, optimize PDF rendering, set max file size limit (10MB)

### Risk 3: User Adoption
**Impact**: High | **Probability**: Low
- **Mitigation**: User-friendly UI, comprehensive user guide, training sessions, gather feedback early

### Risk 4: Data Security
**Impact**: High | **Probability**: Low
- **Mitigation**: Implement security best practices, regular security audit, secure file storage

### Risk 5: Scalability Issues
**Impact**: Medium | **Probability**: Medium
- **Mitigation**: Design for scalability from start, use cloud infrastructure with auto-scaling, load testing before launch

---

## 14. Dependencies & Assumptions

### Dependencies
- Availability of reviewer untuk melakukan review
- Admin availability untuk assign reviewer dan manage toggle
- Stable internet connection untuk users
- IT infrastructure untuk hosting

### Assumptions
- Mahasiswa sudah familiar dengan format proposal PKM
- Reviewer punya komputer dengan browser modern
- Admin punya basic technical knowledge untuk manage sistem
- PDF file yang diupload valid dan tidak corrupted

---

## 15. Appendix

### A. Workflow Diagram

#### Complete Proposal Workflow
```
1. Mahasiswa Create Team (min 1 orang) → Status: DRAFT
2. Team add anggota (minimal 3 orang total)
3. Team input Dosen Pembimbing
4. Team upload PDF proposal → Status: SUBMITTED
5. Admin assign 2 reviewer
6. Admin toggle ON Review → Status: UNDER REVIEW
7. Reviewer melakukan penilaian (administrasi + substansi + highlight)
8. Admin toggle OFF Review → Status: REVIEWED (reviewer tidak bisa edit lagi)
9. Admin toggle ON Upload Ulang
10. Mahasiswa upload file revisi (file baru ditambahkan, review lama tetap ada)
11. Admin toggle OFF Upload Ulang → Status: SUDAH DI REVISI (END)
```

### B. Glossary
- **PKM**: Program Kreativitas Mahasiswa
- **Dosen Pembimbing (Dosbim)**: Dosen yang membimbing team (data text, bukan user)
- **Reviewer**: Dosen yang menilai proposal (user dengan akun)
- **Administrasi Assessment**: Penilaian teknis berupa checklist (margin, halaman, struktur)
- **Substansi Assessment**: Penilaian konten berupa skor (originalitas, metodologi, dll)
- **Blind Review**: Review independent, reviewer tidak bisa lihat review dari reviewer lain

### C. Reference Documents
- [System Diagram](file:///C:/Users/kresna/.gemini/antigravity/brain/004b41a4-6535-4038-b8db-6a7b3e140960/uploaded_media_1769958121894.png)
- [Clarification Questions Round 1-9](file:///C:/Users/kresna/.gemini/antigravity/brain/004b41a4-6535-4038-b8db-6a7b3e140960/)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-01  
**Prepared by**: Product Team  
**Status**: Ready for Review
