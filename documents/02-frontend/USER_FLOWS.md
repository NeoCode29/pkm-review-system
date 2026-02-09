# User Flows & Wireframes
## PKM Review Application

> **Purpose**: Document key user journeys and interaction patterns for the PKM Review system.

---

## 🎯 Key User Flows

### 1. Mahasiswa: Team Creation & Proposal Submission

```
Start
  ↓
Login/Register
  ↓
Dashboard
  ↓
Create Team
  ├─ Enter team name
  ├─ Enter proposal title
  ├─ Select PKM type
  └─ Submit
  ↓
Invite Members (2-4 more)
  ├─ Enter email
  ├─ Send invitation
  └─ Wait for acceptance
  ↓
Team Complete (3-5 members)
  ↓
Upload Proposal File (PDF)
  ├─ Select file
  ├─ Validate (PDF, <10MB)
  └─ Upload
  ↓
Review & Submit
  ├─ Check all requirements
  ├─ Confirm submission
  └─ Submit
  ↓
Track Status
  ├─ Under Review
  ├─ View reviewer feedback
  └─ [If needs revision] → Upload revised file
  ↓
Final Status
  ├─ Approved ✅
  ├─ Rejected ❌
  └─ Needs Revision 🔄
```

---

### 2. Reviewer: Review Proposal

```
Start
  ↓
Login
  ↓
Dashboard (List of Assigned Proposals)
  ├─ See proposals to review
  ├─ Filter by status
  └─ Sort by deadline
  ↓
Select Proposal
  ↓
View Proposal Details
  ├─ Team information
  ├─ Proposal title
  └─ Download PDF
  ↓
Read & Annotate PDF
  ├─ View in PDF viewer
  ├─ Highlight sections
  └─ Add comments
  ↓
Fill Review Form
  ├─ Administratif score (0-100)
  ├─ Substantif score (0-100)
  ├─ Catatan/Notes (required)
  └─ Recommendation
      ├─ Approved
      ├─ Needs Revision
      └─ Rejected
  ↓
Submit Review
  ↓
[System checks if both reviewers done]
  ├─ Yes → Update proposal status
  └─ No → Wait for other reviewer
  ↓
End
```

---

### 3. Admin: Assign Reviewers

```
Start
  ↓
Login
  ↓
Admin Dashboard
  ├─ Total proposals
  ├─ Pending assignments
  └─ Review statistics
  ↓
View Submitted Proposals
  ├─ Filter unassigned
  └─ Sort by submission date
  ↓
Select Proposal
  ↓
View Reviewer List
  ├─ See available reviewers
  ├─ Check workload
  └─ Check expertise
  ↓
Select 2 Reviewers
  ├─ Check availability
  ├─ Validate selection (exactly 2)
  └─ Confirm assignment
  ↓
Notify Reviewers
  ├─ Send email notification
  └─ Update proposal status to "under_review"
  ↓
Monitor Progress
  ├─ Track review completion
  └─ Send reminders if needed
  ↓
End
```

---

## 🖼️ Page Structures

### Mahasiswa Dashboard

```
┌─────────────────────────────────────────────────┐
│ Header: Logo | Navigation | Profile             │
├─────────────────────────────────────────────────┤
│                                                 │
│ Welcome back, [Student Name]!                   │
│                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Total    │ │ Active   │ │ Approved │        │
│ │ Teams: 2 │ │ Teams: 1 │ │ Teams: 1 │        │
│ └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│ My Teams                        [+ Create Team] │
│ ┌───────────────────────────────────────────┐  │
│ │ Team Alpha                     [Approved]  │  │
│ │ Proposal: AI in Education                 │  │
│ │ Members: 5 | Files: 1                     │  │
│ │                        [View] [Download]  │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ Team Beta                  [Under Review]  │  │
│ │ Proposal: Smart Agriculture               │  │
│ │ Members: 4 | Files: 1                     │  │
│ │ Reviewers: 2/2 completed                  │  │
│ │                        [View] [Download]  │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Reviewer Dashboard

```
┌─────────────────────────────────────────────────┐
│ Header: Logo | Navigation | Profile             │
├─────────────────────────────────────────────────┤
│                                                 │
│ Reviewer Panel                                  │
│                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Assigned │ │ Pending  │ │ Reviewed │        │
│ │    12    │ │     5    │ │     7    │        │
│ └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│ Filter: [All ▼] [Sort by: Latest ▼]            │
│                                                 │
│ Proposals to Review                             │
│ ┌───────────────────────────────────────────┐  │
│ │ ⚠️ Deadline: 2 days    [Pending Review]   │  │
│ │ Team: Innovation Hub                       │  │
│ │ Proposal: Blockchain for Supply Chain     │  │
│ │ Submitted: 3 days ago                      │  │
│ │ Co-reviewer: Prof. John (Completed)       │  │
│ │                           [Review Now] →  │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ Deadline: 5 days       [Pending Review]   │  │
│ │ Team: Tech Innovators                      │  │
│ │ Proposal: IoT Smart Home                  │  │
│ │ Submitted: 1 day ago                       │  │
│ │ Co-reviewer: Dr. Sarah (Pending)          │  │
│ │                           [Review Now] →  │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Review Form Page

```
┌─────────────────────────────────────────────────┐
│ ← Back to Dashboard                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ Review Proposal                                 │
│                                                 │
│ ┌─ Team Info ──────────────────────────────┐   │
│ │ Team Name: Innovation Hub                 │   │
│ │ Proposal: Blockchain for Supply Chain     │   │
│ │ PKM Type: PKM-KC                          │   │
│ │ Members: 5 students                       │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌─ PDF Viewer ─────────────────────────────┐   │
│ │ [Toolbar: Zoom, Rotate, Annotate]        │   │
│ │                                           │   │
│ │   [PDF Document Preview]                  │   │
│ │                                           │   │
│ │   Page 1 of 15            [< 1 / 15 >]   │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌─ Review Form ────────────────────────────┐   │
│ │                                           │   │
│ │ Administratif Score *                     │   │
│ │ [  85  ] /100                             │   │
│ │ ────────────────────────────              │   │
│ │                                           │   │
│ │ Substantif Score *                        │   │
│ │ [  78  ] /100                             │   │
│ │ ────────────────────────────              │   │
│ │                                           │   │
│ │ Total Score: 80.1 (calculated)            │   │
│ │ (30% admin + 70% substantif)              │   │
│ │                                           │   │
│ │ Catatan / Feedback *                      │   │
│ │ ┌─────────────────────────────────────┐  │   │
│ │ │ Overall good proposal, but needs    │  │   │
│ │ │ improvement in methodology section   │  │   │
│ │ │                                      │  │   │
│ │ └─────────────────────────────────────┘  │   │
│ │                                           │   │
│ │ Recommendation *                          │   │
│ │ ○ Approved                                │   │
│ │ ● Needs Revision                          │   │
│ │ ○ Rejected                                │   │
│ │                                           │   │
│ │ [Cancel]              [Submit Review]     │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔄 State Transitions

### Proposal Status Flow

```
┌─────────┐
│  Draft  │ ← Initial creation
└────┬────┘
     │ Team submits
     ▼
┌──────────┐
│Submitted │
└────┬─────┘
     │ Admin assigns reviewers
     ▼
┌─────────────┐
│Under Review │
└──────┬──────┘
       │ Both reviewers submit
       ▼
   ┌────────────┐
   │  Decision  │
   └──┬──┬──┬───┘
      │  │  │
      │  │  └────────┐
      │  │           │
      ▼  ▼           ▼
┌─────────┐  ┌──────────────┐  ┌─────────┐
│Approved │  │Needs Revision│  │Rejected │
└─────────┘  └──────┬───────┘  └─────────┘
                    │
                    │ Team uploads revision
                    ▼
               ┌─────────┐
               │ Revised │
               └────┬────┘
                    │
                    └──→ Back to Under Review
```

---

## 📱 Mobile Considerations

### Mobile Navigation

```
Bottom Tab Bar:
┌──────┬──────┬──────┬──────┐
│ Home │Teams │Files │Profile│
│  🏠  │  👥  │ 📁  │  👤  │
└──────┴──────┴──────┴──────┘
```

### Mobile Cards (Compact)

```
┌────────────────────────┐
│ Team Alpha        [⋮] │
│ AI in Education        │
│ ──────────────────     │
│ Status: Approved ✅    │
│ 5 members | 1 file     │
│ [View]            [↓]  │
└────────────────────────┘
```

---

## ✨ Interaction Patterns

### Team Creation Flow

**Step 1: Team Info**
```
Create New Team
━━━━━━●○○○

Team Name *
[________________________]

Proposal Title *
[________________________]

PKM Type *
[Select type ▼]

[Cancel]        [Next →]
```

**Step 2: Invite Members**
```
Create New Team
━━━━━━━●○○

Invite Team Members (2-4 more needed)

Email Address
[________________________] [+ Add]

Added Members:
✓ john@example.com
✓ sarah@example.com

[← Back]        [Next →]
```

**Step 3: Confirmation**
```
Create New Team
━━━━━━━━●○

Review Team Information

Team Name: Innovation Hub
Proposal: AI in Education
PKM Type: PKM-KC
Members: 3 (minimum met ✓)

⚠️ You will be the Team Leader (Ketua)

[← Back]        [Create Team]
```

---

## 🎨 Visual Feedback Examples

### Success State
```
┌──────────────────────────────┐
│  ✅ Team Created!            │
│                              │
│  Your team "Innovation Hub"  │
│  has been created.           │
│                              │
│  [View Team]  [Create More]  │
└──────────────────────────────┘
```

### Error State
```
┌──────────────────────────────┐
│  ❌ Upload Failed            │
│                              │
│  File size exceeds 10MB      │
│  limit. Please compress      │
│  your PDF and try again.     │
│                              │
│  [Try Again]      [Cancel]   │
└──────────────────────────────┘
```

### Loading State
```
┌──────────────────────────────┐
│  ⌛ Uploading...             │
│                              │
│  ████████████░░░░░░░   75%   │
│                              │
│  Uploading proposal.pdf      │
└──────────────────────────────┘
```

---

## 📋 Quick Reference

**Key Interactions**:
- Click card → View details
- Drag & drop → Upload file
- Right-click table row → Context menu
- Hover card → Show actions
- Double-click filename → Download

**Keyboard Shortcuts**:
- `Ctrl+K` or `⌘K` → Search
- `Esc` → Close modal
- `Enter` → Submit form
- `/` → Focus search

---

**User flows should be intuitive and efficient!** 🎯
