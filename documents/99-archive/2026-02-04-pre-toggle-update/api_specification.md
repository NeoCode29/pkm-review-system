# API Specification Document
## PKM Review Application

**Version**: 1.0  
**Date**: 2026-02-02  
**Base URL**: `https://api.pkmreview.app` (production) or `http://localhost:3000` (dev)  
**API Pattern**: RESTful API with Next.js API Routes

---

## Table of Contents
1. [Authentication APIs](#1-authentication-apis)
2. [Team Management APIs](#2-team-management-apis)
3. [Proposal Management APIs](#3-proposal-management-apis)
4. [Review & Assessment APIs](#4-review--assessment-apis)
5. [Admin - User Management](#5-admin---user-management)
6. [Admin - Master Data](#6-admin---master-data)
7. [Admin - Configuration](#7-admin--configuration)
8. [Common Response Formats](#8-common-response-formats)

---

## General Information

### Authentication
- **Type**: Bearer Token (JWT from Supabase Auth)
- **Header**: `Authorization: Bearer {token}`
- **Cookie**: Session stored in HTTP-only cookie

### Content Types
- **Request**: `application/json` (except file uploads: `multipart/form-data`)
- **Response**: `application/json`

### Error Responses
All error responses follow this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // optional
}
```

### HTTP Status Codes
- `200 OK`: Successful GET/PUT request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource (e.g., unique constraint)
- `500 Internal Server Error`: Server error

---

## 1. Authentication APIs

### 1.1 Register Mahasiswa

**Endpoint**: `POST /api/auth/register`  
**Auth Required**: No  
**Description**: Register new student account

**Request Body**:
```json
{
  "nama": "John Doe",
  "nim": "123456789012",
  "email": "john@example.com",
  "password": "securePassword123",
  "noHp": "081234567890",
  "jurusanId": "1",
  "programStudiId": "5"
}
```

**Response** (201):
```json
{
  "user": {
    "id": "uuid-here",
    "email": "john@example.com"
  },
  "mahasiswa": {
    "id": "1",
    "nama": "John Doe",
    "nim": "123456789012",
    "email": "john@example.com",
    "jurusanId": "1",
    "programStudiId": "5"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token"
  }
}
```

**Errors**:
- `409`: NIM or email already exists
- `400`: Invalid input (NIM not 12 digits, invalid email, etc.)

---

### 1.2 Login

**Endpoint**: `POST /api/auth/login`  
**Auth Required**: No  
**Description**: Login with email and password

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "role": "mahasiswa"
  },
  "profile": {
    "id": "1",
    "nama": "John Doe",
    "nim": "123456789012"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token"
  }
}
```

**Errors**:
- `401`: Invalid credentials

---

### 1.3 Logout

**Endpoint**: `POST /api/auth/logout`  
**Auth Required**: Yes  
**Description**: Logout current user

**Request Body**: None

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

---

### 1.4 Get Current User

**Endpoint**: `GET /api/auth/me`  
**Auth Required**: Yes  
**Description**: Get current authenticated user

**Response** (200):
```json
{
  "userId": "uuid-here",
  "email": "john@example.com",
  "role": "mahasiswa",
  "profile": {
    "id": "1",
    "nama": "John Doe",
    "nim": "123456789012",
    "jurusan": "Teknik Informatika",
    "programStudi": "S1 Teknik Informatika"
  }
}
```

---

## 2. Team Management APIs

### 2.1 Create Team

**Endpoint**: `POST /api/teams`  
**Auth Required**: Yes (Mahasiswa)  
**Description**: Create new team

**Request Body**:
```json
{
  "namaTeam": "Tim Inovasi",
  "judulProposal": "Aplikasi Monitoring Kualitas Udara",
  "jenisPkmId": "3"
}
```

**Response** (201):
```json
{
  "id": "1",
  "namaTeam": "Tim Inovasi",
  "judulProposal": "Aplikasi Monitoring Kualitas Udara",
  "jenisPkmId": "3",
  "status": "active",
  "teamMembers": [
    {
      "id": "1",
      "mahasiswaId": "15",
      "role": "ketua"
    }
  ],
  "proposals": [
    {
      "id": "1",
      "type": "original",
      "status": "draft"
    },
    {
      "id": "2",
      "type": "revised",
      "status": "draft"
    }
  ]
}
```

**Business Logic**:
- Auto-create 2 proposals (original + revised)
- Creator becomes first team member

---

### 2.2 Get Team Detail

**Endpoint**: `GET /api/teams/[id]`  
**Auth Required**: Yes  
**Description**: Get team details

**Response** (200):
```json
{
  "id": "1",
  "namaTeam": "Tim Inovasi",
  "judulProposal": "Aplikasi Monitoring Kualitas Udara",
  "jenisPkm": {
    "id": "3",
    "nama": "PKM-KC",
    "kode": "KC"
  },
  "dosenPembimbing": {
    "id": "5",
    "nama": "Dr. Budi Santoso",
    "nidn": "0123456789",
    "email": "budi@univ.ac.id"
  },
  "status": "active",
  "teamMembers": [
    {
      "id": "1",
      "role": "ketua",
      "mahasiswa": {
        "id": "15",
        "nama": "John Doe",
        "nim": "123456789012",
        "email": "john@example.com"
      }
    }
  ],
  "proposals": [
    {
      "id": "1",
      "type": "original",
      "status": "submitted"
    },
    {
      "id": "2",
      "type": "revised",
      "status": "draft"
    }
  ]
}
```

---

### 2.3 Update Team

**Endpoint**: `PUT /api/teams/[id]`  
**Auth Required**: Yes (Team Member)  
**Description**: Update team details

**Request Body**:
```json
{
  "namaTeam": "Tim Inovasi Updated",
  "judulProposal": "Aplikasi Monitoring Kualitas Udara Real-Time",
  "dosenPembimbingId": "5"
}
```

**Response** (200):
```json
{
  "id": "1",
  "namaTeam": "Tim Inovasi Updated",
  "judulProposal": "Aplikasi Monitoring Kualitas Udara Real-Time",
  "dosenPembimbingId": "5"
}
```

---

### 2.4 Add Team Member (Join Request)

**Endpoint**: `POST /api/teams/[id]/join-request`  
**Auth Required**: Yes (Mahasiswa)  
**Description**: Request to join a team

**Request Body**:
```json
{
  "message": "Saya ingin bergabung dengan tim ini"
}
```

**Response** (201):
```json
{
  "id": "5",
  "teamId": "1",
  "mahasiswaId": "20",
  "status": "pending",
  "message": "Saya ingin bergabung dengan tim ini"
}
```

**Business Logic**:
- Auto-reject if team already has 5 members
- Team members can approve/reject

---

### 2.5 Accept/Reject Join Request

**Endpoint**: `PUT /api/teams/[id]/join-request/[requestId]`  
**Auth Required**: Yes (Team Member)  
**Description**: Accept or reject join request

**Request Body**:
```json
{
  "action": "accept"  // or "reject"
}
```

**Response** (200):
```json
{
  "id": "5",
  "status": "accepted",
  "teamMember": {
    "id": "10",
    "teamId": "1",
    "mahasiswaId": "20",
    "role": "anggota"
  }
}
```

---

### 2.6 Remove Team Member

**Endpoint**: `DELETE /api/teams/[id]/members/[memberId]`  
**Auth Required**: Yes (Team Member)  
**Description**: Remove team member (kick or leave)

**Response** (204): No content

**Business Logic**:
- If 0 members left, team auto-deleted
- If <3 members, cannot submit proposal

---

### 2.7 Update Member Role

**Endpoint**: `PUT /api/teams/[id]/members/[memberId]/role`  
**Auth Required**: Yes (Team Member)  
**Description**: Update team member role (ketua/anggota)

**Request Body**:
```json
{
  "role": "ketua"  // or "anggota"
}
```

**Response** (200):
```json
{
  "id": "10",
  "teamId": "1",
  "mahasiswaId": "20",
  "role": "ketua"
}
```

---

### 2.8 Create/Update Dosen Pembimbing

**Endpoint**: `POST /api/dosen-pembimbing`  
**Auth Required**: Yes (Mahasiswa)  
**Description**: Create or find dosen pembimbing

**Request Body**:
```json
{
  "nama": "Dr. Budi Santoso",
  "nidn": "0123456789",
  "email": "budi@univ.ac.id",
  "noHp": "081234567890"
}
```

**Response** (200):
```json
{
  "id": "5",
  "nama": "Dr. Budi Santoso",
  "nidn": "0123456789",
  "email": "budi@univ.ac.id",
  "noHp": "081234567890",
  "isNew": false  // true if newly created
}
```

**Business Logic**:
- If name exists, return existing
- If not, create new

---

## 3. Proposal Management APIs

### 3.1 Upload Proposal (Original)

**Endpoint**: `POST /api/proposals/[proposalId]/upload`  
**Auth Required**: Yes (Team Member)  
**Description**: Upload proposal file

**Request**: `multipart/form-data`
```
file: (PDF file, max 10MB)
```

**Response** (200):
```json
{
  "proposal": {
    "id": "1",
    "teamId": "1",
    "type": "original",
    "status": "submitted"
  },
  "file": {
    "id": "1",
    "proposalId": "1",
    "fileName": "proposal_original.pdf",
    "filePath": "proposals/original/1/1706880000_proposal.pdf",
    "fileSize": 5242880,
    "uploadedBy": "uuid-here"
  }
}
```

**Validation**:
- Team >= 3 members
- Dosen pembimbing must be set
- File type: PDF only
- File size: <= 10MB
- Toggle pengumpulan must be ON

---

### 3.2 Upload Revised Proposal

**Endpoint**: `POST /api/proposals/[proposalId]/upload`  
**Auth Required**: Yes (Team Member)  
**Description**: Upload revised proposal (for proposal with type="revised")

**Same as 3.1**, but:
- `proposalId` must be the revised proposal ID
- Toggle upload ulang must be ON
- Original file stays in original proposal

**Response** (200):
```json
{
  "proposal": {
    "id": "2",
    "teamId": "1",
    "type": "revised",
    "status": "submitted"
  },
  "file": {
    "id": "5",
    "proposalId": "2",
    "fileName": "proposal_revised.pdf",
    "filePath": "proposals/revised/1/1706880000_revised.pdf",
    "fileSize": 4800000
  }
}
```

---

### 3.3 Get Proposal Detail

**Endpoint**: `GET /api/proposals/[id]`  
**Auth Required**: Yes  
**Description**: Get proposal details

**Response** (200):
```json
{
  "id": "1",
  "teamId": "1",
  "type": "original",
  "status": "submitted",
  "team": {
    "id": "1",
    "namaTeam": "Tim Inovasi",
    "judulProposal": "Aplikasi Monitoring Kualitas Udara"
  },
  "files": [
    {
      "id": "1",
      "fileName": "proposal_original.pdf",
      "filePath": "proposals/original/1/1706880000_proposal.pdf",
      "fileSize": 5242880,
      "uploadedAt": "2026-02-02T10:00:00Z"
    }
  ],
  "reviewerAssignments": [
    {
      "id": "1",
      "reviewerNumber": 1,
      "reviewer": {
        "id": "5",
        "nama": "Dr. Reviewer 1"
      }
    }
  ]
}
```

---

### 3.4 Download Proposal File

**Endpoint**: `GET /api/proposals/files/[fileId]/download`  
**Auth Required**: Yes  
**Description**: Download proposal PDF

**Response**: Binary file (PDF)
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="proposal.pdf"`

---

### 3.5 Get Proposal Review Results

**Endpoint**: `GET /api/proposals/[id]/review-results`  
**Auth Required**: Yes (Team Member)  
**Description**: Get aggregated review results

**Response** (200):
```json
{
  "proposalId": "1",
  "administrasi": {
    "reviewer1": {
      "totalKesalahan": 2,
      "details": [
        {
          "kriteria": "Margin tidak sesuai",
          "adaKesalahan": true
        }
      ]
    },
    "reviewer2": {
      "totalKesalahan": 1,
      "details": [
        {
          "kriteria": "Jumlah halaman melebihi",
          "adaKesalahan": true
        }
      ]
    },
    "aggregated": {
      "totalKesalahan": 2,  // Union of errors
      "details": [
        {
          "kriteria": "Margin tidak sesuai",
          "adaKesalahan": true
        },
        {
          "kriteria": "Jumlah halaman melebihi",
          "adaKesalahan": true
        }
      ]
    }
  },
  "substansi": {
    "reviewer1": {
      "totalSkor": 75.5,
      "details": [
        {
          "indikator": "Originalitas",
          "skor": 18
        }
      ]
    },
    "reviewer2": {
      "totalSkor": 80.0,
      "details": [
        {
          "indikator": "Originalitas",
          "skor": 20
        }
      ]
    },
    "aggregated": {
      "totalSkor": 77.75,  // Average
      "details": [
        {
          "indikator": "Originalitas",
          "skorRataRata": 19
        }
      ]
    }
  }
}
```

---

## 4. Review & Assessment APIs

### 4.1 Get Reviewer Assignments

**Endpoint**: `GET /api/reviewer/assignments`  
**Auth Required**: Yes (Reviewer)  
**Description**: Get list of proposals assigned to current reviewer

**Response** (200):
```json
{
  "assignments": [
    {
      "id": "1",
      "proposalId": "1",
      "reviewerNumber": 1,
      "assignedAt": "2026-02-02T08:00:00Z",
      "proposal": {
        "id": "1",
        "type": "original",
        "status": "under_review",
        "team": {
          "namaTeam": "Tim Inovasi",
          "judulProposal": "Aplikasi Monitoring"
        }
      },
      "penilaianAdministrasi": {
        "isComplete": false
      },
      "penilaianSubstansi": {
        "isComplete": false
      }
    }
  ]
}
```

---

### 4.2 Submit Administrative Assessment

**Endpoint**: `POST /api/reviewer/assignments/[assignmentId]/penilaian-administrasi`  
**Auth Required**: Yes (Reviewer)  
**Description**: Submit or update administrative assessment

**Request Body**:
```json
{
  "catatan": "Ada beberapa kesalahan formatting",
  "details": [
    {
      "kriteriaAdministrasiId": "5",
      "adaKesalahan": true
    },
    {
      "kriteriaAdministrasiId": "6",
      "adaKesalahan": false
    }
  ],
  "isComplete": true
}
```

**Response** (200):
```json
{
  "id": "1",
  "reviewerAssignmentId": "1",
  "totalKesalahan": 1,
  "catatan": "Ada beberapa kesalahan formatting",
  "isComplete": true,
  "details": [
    {
      "id": "1",
      "kriteriaAdministrasiId": "5",
      "adaKesalahan": true
    }
  ]
}
```

---

### 4.3 Submit Substantive Assessment

**Endpoint**: `POST /api/reviewer/assignments/[assignmentId]/penilaian-substansi`  
**Auth Required**: Yes (Reviewer)  
**Description**: Submit or update substantive assessment

**Request Body**:
```json
{
  "catatan": "Proposal cukup baik, perlu perbaikan metodologi",
  "details": [
    {
      "kriteriaSubstansiId": "10",
      "skor": 18
    },
    {
      "kriteriaSubstansiId": "11",
      "skor": 25
    }
  ],
  "isComplete": true
}
```

**Response** (200):
```json
{
  "id": "1",
  "reviewerAssignmentId": "1",
  "totalSkor": 75.5,
  "catatan": "Proposal cukup baik",
  "isComplete": true,
  "details": [
    {
      "id": "1",
      "kriteriaSubstansiId": "10",
      "skor": 18
    }
  ]
}
```

---

### 4.4 Submit PDF Annotation

**Endpoint**: `POST /api/reviewer/annotations`  
**Auth Required**: Yes (Reviewer)  
**Description**: Add PDF annotation (highlight or comment)

**Request Body**:
```json
{
  "proposalFileId": "1",
  "reviewerAssignmentId": "1",
  "type": "highlight",
  "pageNumber": 5,
  "annotationData": {
    "coordinates": {
      "x": 100,
      "y": 200,
      "width": 150,
      "height": 20
    },
    "text": "Teks yang di-highlight",
    "color": "#FFFF00",
    "reviewer_number": 1
  }
}
```

**Response** (201):
```json
{
  "id": "1",
  "proposalFileId": "1",
  "reviewerAssignmentId": "1",
  "type": "highlight",
  "pageNumber": 5,
  "annotationData": { /* same as request */ }
}
```

---

### 4.5 Get Annotations for Proposal

**Endpoint**: `GET /api/proposals/files/[fileId]/annotations`  
**Auth Required**: Yes  
**Description**: Get all annotations for a proposal file

**Query Parameters**:
- `reviewerNumber` (optional): Filter by reviewer (1 or 2)
- `pageNumber` (optional): Filter by page

**Response** (200):
```json
{
  "annotations": [
    {
      "id": "1",
      "type": "highlight",
      "pageNumber": 5,
      "annotationData": {
        "coordinates": { "x": 100, "y": 200, "width": 150, "height": 20 },
        "text": "Teks yang di-highlight",
        "color": "#FFFF00",
        "reviewer_number": 1
      },
      "reviewerAssignment": {
        "reviewerNumber": 1,
        "reviewer": {
          "nama": "Dr. Reviewer 1"
        }
      }
    }
  ]
}
```

---

### 4.6 Delete Annotation

**Endpoint**: `DELETE /api/reviewer/annotations/[id]`  
**Auth Required**: Yes (Reviewer - owner only)  
**Description**: Delete annotation

**Response** (204): No content

---

## 5. Admin - User Management

### 5.1 Get All Mahasiswa

**Endpoint**: `GET /api/admin/mahasiswa`  
**Auth Required**: Yes (Admin)  
**Description**: List all students

**Query Parameters**:
- `search`: Search by name or NIM
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response** (200):
```json
{
  "data": [
    {
      "id": "1",
      "nama": "John Doe",
      "nim": "123456789012",
      "email": "john@example.com",
      "jurusan": "Teknik",
      "programStudi": "Teknik Informatika"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 5.2 Update Mahasiswa

**Endpoint**: `PUT /api/admin/mahasiswa/[id]`  
**Auth Required**: Yes (Admin)  
**Description**: Update student data

**Request Body**:
```json
{
  "nama": "John Doe Updated",
  "email": "john.updated@example.com",
  "noHp": "081234567890",
  "jurusanId": "1",
  "programStudiId": "5"
}
```

**Response** (200):
```json
{
  "id": "1",
  "nama": "John Doe Updated",
  "email": "john.updated@example.com"
}
```

---

### 5.3 Delete Mahasiswa

**Endpoint**: `DELETE /api/admin/mahasiswa/[id]`  
**Auth Required**: Yes (Admin)  
**Description**: Delete student

**Response** (204): No content

---

### 5.4 Reset Password

**Endpoint**: `POST /api/admin/users/[userId]/reset-password`  
**Auth Required**: Yes (Admin)  
**Description**: Reset user password

**Request Body**:
```json
{
  "newPassword": "newSecurePassword123"
}
```

**Response** (200):
```json
{
  "message": "Password reset successfully",
  "userId": "uuid-here"
}
```

---

### 5.5 Create Reviewer

**Endpoint**: `POST /api/admin/reviewers`  
**Auth Required**: Yes (Admin)  
**Description**: Create reviewer account

**Request Body**:
```json
{
  "nama": "Dr. Reviewer Baru",
  "nidn": "0123456789",
  "email": "reviewer@univ.ac.id",
  "noHp": "081234567890",
  "password": "reviewerPassword123"
}
```

**Response** (201):
```json
{
  "user": {
    "id": "uuid-here",
    "email": "reviewer@univ.ac.id"
  },
  "reviewer": {
    "id": "10",
    "nama": "Dr. Reviewer Baru",
    "nidn": "0123456789",
    "email": "reviewer@univ.ac.id"
  }
}
```

---

### 5.6 Get All Reviewers

**Endpoint**: `GET /api/admin/reviewers`  
**Auth Required**: Yes (Admin)  
**Description**: List all reviewers

**Response** (200):
```json
{
  "data": [
    {
      "id": "1",
      "nama": "Dr. Reviewer 1",
      "nidn": "0123456789",
      "email": "reviewer1@univ.ac.id",
      "assignmentCount": 15  // Total proposals assigned
    }
  ]
}
```

---

## 6. Admin - Master Data

### 6.1 CRUD Jenis PKM

**Get All**: `GET /api/admin/jenis-pkm`
**Get One**: `GET /api/admin/jenis-pkm/[id]`
**Create**: `POST /api/admin/jenis-pkm`
**Update**: `PUT /api/admin/jenis-pkm/[id]`
**Delete**: `DELETE /api/admin/jenis-pkm/[id]`

**Example Create Request**:
```json
{
  "nama": "PKM-Riset Eksakta",
  "kode": "RE",
  "deskripsi": "Program riset di bidang eksakta"
}
```

---

### 6.2 CRUD Jurusan & Program Studi

**Jurusan**:
- `GET /api/admin/jurusan`
- `POST /api/admin/jurusan`
- `PUT /api/admin/jurusan/[id]`
- `DELETE /api/admin/jurusan/[id]`

**Program Studi**:
- `GET /api/admin/program-studi`
- `POST /api/admin/program-studi`
- `PUT /api/admin/program-studi/[id]`
- `DELETE /api/admin/program-studi/[id]`

**Example Create Prodi**:
```json
{
  "jurusanId": "1",
  "nama": "S1 Teknik Informatika"
}
```

---

### 6.3 CRUD Kriteria Administrasi

**Get by Jenis PKM**: `GET /api/admin/kriteria-administrasi?jenisPkmId=3`
**Create**: `POST /api/admin/kriteria-administrasi`
**Update**: `PUT /api/admin/kriteria-administrasi/[id]`
**Delete**: `DELETE /api/admin/kriteria-administrasi/[id]`

**Example Create**:
```json
{
  "jenisPkmId": "3",
  "deskripsi": "Margin tidak sesuai (Top: 3cm, Left: 4cm)",
  "urutan": 1
}
```

---

### 6.4 CRUD Kriteria Substansi

**Get by Jenis PKM**: `GET /api/admin/kriteria-substansi?jenisPkmId=3`
**Create**: `POST /api/admin/kriteria-substansi`
**Update**: `PUT /api/admin/kriteria-substansi/[id]`
**Delete**: `DELETE /api/admin/kriteria-substansi/[id]`

**Example Create**:
```json
{
  "jenisPkmId": "3",
  "nama": "Originalitas Ide",
  "deskripsi": "Penilaian terhadap kebaruan ide",
  "skorMin": 0,
  "skorMax": 20,
  "bobot": 25.5,
  "urutan": 1
}
```

---

## 7. Admin - Configuration

### 7.1 Assign Reviewer to Proposal

**Endpoint**: `POST /api/admin/reviewer-assignments`  
**Auth Required**: Yes (Admin)  
**Description**: Assign 2 reviewers to a proposal

**Request Body**:
```json
{
  "proposalId": "1",
  "reviewer1Id": "5",
  "reviewer2Id": "10"
}
```

**Response** (201):
```json
{
  "assignments": [
    {
      "id": "1",
      "proposalId": "1",
      "reviewerUserId": "5",
      "reviewerNumber": 1
    },
    {
      "id": "2",
      "proposalId": "1",
      "reviewerUserId": "10",
      "reviewerNumber": 2
    }
  ]
}
```

---

### 7.2 Bulk Assign Reviewers

**Endpoint**: `POST /api/admin/reviewer-assignments/bulk`  
**Auth Required**: Yes (Admin)  
**Description**: Assign reviewers to multiple proposals

**Request Body**:
```json
{
  "jenisPkmId": "3",  // Filter proposals by jenis PKM
  "reviewer1Id": "5",
  "reviewer2Id": "10"
}
```

**Response** (200):
```json
{
  "assignedCount": 15,
  "assignments": [
    { "proposalId": "1", "reviewers": ["5", "10"] },
    { "proposalId": "2", "reviewers": ["5", "10"] }
  ]
}
```

---

### 7.3 Toggle Configuration

**Endpoint**: `PUT /api/admin/toggles/[toggleName]`  
**Auth Required**: Yes (Admin)  
**Description**: Update toggle configuration

**Toggle Names**:
- `pengumpulan`: Enable/disable proposal submission
- `review`: Enable/disable review period
- `upload_ulang`: Enable/disable revised proposal upload

**Request Body**:
```json
{
  "enabled": true
}
```

**Response** (200):
```json
{
  "config_key": "toggle_pengumpulan",
  "config_value": {
    "enabled": true
  }
}
```

**Side Effects**:
- **Toggle Review ON**: All proposals `submitted` → `under_review`
- **Toggle Review OFF**: All proposals `under_review` → `reviewed`
- **Toggle Upload Ulang OFF**: All revised proposals `submitted` → `sudah_di_revisi`

---

### 7.4 Get System Configuration

**Endpoint**: `GET /api/admin/config`  
**Auth Required**: Yes (Admin)  
**Description**: Get all system configurations

**Response** (200):
```json
{
  "toggles": {
    "pengumpulan": { "enabled": true },
    "review": { "enabled": false },
    "upload_ulang": { "enabled": false }
  },
  "settings": {
    "max_file_size_mb": 10,
    "min_team_members": 3,
    "max_team_members": 5
  }
}
```

---

### 7.5 Upload Proposal Template

**Endpoint**: `POST /api/admin/templates`  
**Auth Required**: Yes (Admin)  
**Description**: Upload proposal template

**Request**: `multipart/form-data`
```
file: (PDF file)
jenisPkmId: "3"
namaTemplate: "Template PKM-KC"
deskripsi: "Template resmi untuk PKM-KC"
```

**Response** (201):
```json
{
  "id": "1",
  "jenisPkmId": "3",
  "namaTemplate": "Template PKM-KC",
  "fileName": "template_pkm_kc.pdf",
  "filePath": "templates/3/template_pkm_kc.pdf"
}
```

---

### 7.6 Get Dashboard Statistics

**Endpoint**: `GET /api/admin/dashboard/stats`  
**Auth Required**: Yes (Admin)  
**Description**: Get dashboard statistics

**Response** (200):
```json
{
  "summary": {
    "totalProposals": 125,
    "totalTeams": 125,
    "totalMahasiswa": 450,
    "totalReviewers": 20
  },
  "proposalsByStatus": {
    "draft": 10,
    "submitted": 50,
    "under_review": 30,
    "reviewed": 25,
    "sudah_di_revisi": 10
  },
  "proposalsByJenisPkm": [
    { "jenisPkm": "PKM-RE", "count": 40 },
    { "jenisPkm": "PKM-KC", "count": 35 }
  ],
  "reviewerProgress": [
    {
      "reviewerId": "1",
      "reviewerName": "Dr. Reviewer 1",
      "totalAssigned": 15,
      "completed": 10,
      "progress": 66.67
    }
  ]
}
```

---

## 8. Common Response Formats

### 8.1 Pagination

All list endpoints support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Format**:
```json
{
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 8.2 Error Response

```json
{
  "error": "Human readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Field-specific error"
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: Not authenticated
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Input validation failed
- `DUPLICATE_ENTRY`: Unique constraint violation
- `INTERNAL_ERROR`: Server error

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-02  
**Total Endpoints**: 40+
