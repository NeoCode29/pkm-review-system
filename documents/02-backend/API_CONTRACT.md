# API Contract - PKM Review Backend

> **Purpose**: Definitive API contract for all backend endpoints. This is the agreement between frontend and backend.

---

## 🔐 Authentication

All endpoints (except auth endpoints) require JWT Bearer token in header:
```
Authorization: Bearer <token>
```

---

## 📋 Common Response Formats

### Success Response
```typescript
{
  "statusCode": 200,
  "data": { ... }  // or array for list endpoints
}
```

### Error Response
```typescript
{
  "statusCode": 400, 
  "message": "Error description",
  "error": "Bad Request"
}
```

### Paginated Response
```typescript
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "perPage": 20,
    "totalPages": 5
  }
}
```

---

## 🚀 Endpoints

### Authentication (`/auth`)

#### `POST /auth/register`
Register new mahasiswa account.

**Request:**
```json
{
  "email": "mahasiswa@example.com",
  "password": "securePassword123",
  "nim": "1234567890",
  "nama": "John Doe",
  "prodi": "Teknik Informatika"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "mahasiswa@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

---

#### `POST /auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "mahasiswa"
  }
}
```

---

### Teams (`/teams`)

#### `POST /teams`
**Auth:** mahasiswa only  
Create a new team.

**Request:**
```json
{
  "namaTeam": "Team Alpha",
  "judulProposal": "Innovative IoT Solution for Smart Farming",
  "jenisPkmId": "1",
  "dosenPembimbingId": "5" // optional
}
```

**Response:** `201 Created`
```json
{
  "id": "1",
  "namaTeam": "Team Alpha",
  "judulProposal": "Innovative IoT Solution...",
  "jenisPkm": { "id": "1", "nama": "PKM-KC" },
  "createdBy": "user_id",
  "createdAt": "2026-02-04T12:00:00Z"
}
```

**Validations:**
- `namaTeam`: 3-255 chars
- `judulProposal`: min 10 chars
- User can create max 2 teams per period

---

#### `GET /teams`
**Auth:** mahasiswa, admin  
Get all teams for current user (mahasiswa) or all teams (admin).

**Query Params:**
- `page` (default: 1)
- `perPage` (default: 20)
- `jenisPkmId` (filter by type)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "1",
      "namaTeam": "Team Alpha",
      "judulProposal": "...",
      "memberCount": 5,
      "status": "active"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "perPage": 20
  }
}
```

---

#### `GET /teams/:id`
**Auth:** team members, admin  
Get team details with members and proposals.

**Response:** `200 OK`
```json
{
  "id": "1",
  "namaTeam": "Team Alpha",
  "judulProposal": "...",
  "jenisPkm": { "id": "1", "nama": "PKM-KC" },
  "members": [
    {
      "id": "1",
      "mahasiswa": {
        "nim": "1234567890",
        "nama": "John Doe"
      },
      "role": "ketua",
      "joinedAt": "2026-02-04T12:00:00Z"
    }
  ],
  "proposals": [...]
}
```

**Authorization:**
- Mahasiswa: only if member of team
- Admin: all teams

---

### Proposals (`/proposals`)

#### `POST /proposals`
**Auth:** team ketua only  
Create proposal for a team.

**Request:**
```json
{
  "teamId": "1",
  "judulProposal": "Updated Title"  // optional, overrides team title
}
```

**Response:** `201 Created`
```json
{
  "id": "1",
  "teamId": "1",
  "judulProposal": "Updated Title",
  "status": "draft",
  "createdAt": "2026-02-04T12:00:00Z"
}
```

---

#### `POST /proposals/:id/upload`
**Auth:** team ketua  
Upload proposal PDF file.

**Request:** `multipart/form-data`
```
file: <PDF file>
type: "original" | "revised"
```

**Response:** `200 OK`
```json
{
  "fileId": "1",
  "fileName": "proposal.pdf",
  "fileSize": 2048576,
  "uploadedAt": "2026-02-04T12:00:00Z",
  "url": "https://storage.../proposals/..."
}
```

**Validations:**
- Max size: 10MB
- Type: application/pdf only

---

#### `PUT /proposals/:id/submit`
**Auth:** team ketua  
Submit proposal for review.

**Response:** `200 OK`
```json
{
  "id": "1",
  "status": "submitted",
  "submittedAt": "2026-02-04T12:30:00Z"
}
```

**Business Rules:**
- Must have uploaded file
- Can only submit from  'draft' status
- Cannot modify after submission

---

### Reviews (`/reviews`)

#### `GET /reviews/my-assignments`
**Auth:** reviewer  
Get proposals assigned to current reviewer.

**Response:** `200 OK`
```json
{
  "data": [
    {
      "proposalId": "1",
      "judulProposal": "...",
      "teamName": "Team Alpha",
      "assignedAt": "2026-02-04T12:00:00Z",
      "status": "pending",
      "file": {
        "url": "...",
        "fileName": "proposal.pdf"
      }
    }
  ]
}
```

---

#### `POST /reviews`
**Auth:** reviewer  
Submit review for a proposal.

**Request:**
```json
{
  "proposalId": "1",
  "administratifScore": 85,
  "substantifScore": 78,
  "catatan": "Proposal needs improvement in methodology section",
  "rekomendasi": "needs_revision",  // "approved" | "needs_revision" | "rejected"
  "annotations": [
    {
      "pageNumber": 3,
      "annotationData": {
        "coordinates": { "x": 100, "y": 200, "width": 300, "height": 20 },
        "text": "Highlighted text",
        "color": "#FFFF00"
      },
      "comment": "This section needs clarification"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "1",
  "reviewerId": "reviewer_id",
  "proposalId": "1",
  "administratifScore": 85,
  "substantifScore": 78,
  "totalScore": 81.5,
  "rekomendasi": "needs_revision",
  "submittedAt": "2026-02-04T12:00:00Z"
}
```

**Validations:**
- Score range: 0-100
- Must include catatan if needs_revision
- Can only review assigned proposals

---

### Admin - Reviewer Assignment (`/admin/assignments`)

#### `POST /admin/assignments`
**Auth:** admin only  
Assign reviewers to a proposal.

**Request:**
```json
{
  "proposalId": "1",
  "reviewerIds": ["reviewer1_id", "reviewer2_id"]
}
```

**Response:** `201 Created`
```json
{
  "proposalId": "1",
  "assignments": [
    {
      "reviewerId": "reviewer1_id",
      "assignedAt": "2026-02-04T12:00:00Z"
    },
    {
      "reviewerId": "reviewer2_id",
      "assignedAt": "2026-02-04T12:00:00Z"
    }
  ]
}
```

**Business Rules:**
- Exactly 2 reviewers per proposal
- Cannot reassign after any review started

---

## 🎯 Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate or constraint violation |
| 500 | Internal Server Error | Server error |

---

## 🔄 Versioning

Current API version: **v1**  
Base URL: `/api/v1`

---

**This contract is binding. Any deviation must be documented and approved.**
