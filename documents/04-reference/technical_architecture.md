# Technical Architecture Document
## PKM Review Application

**Version**: 1.0  
**Date**: 2026-02-02  
**Status**: Design Phase

---

## 1. Executive Summary

This document outlines the technical architecture, technology stack, and implementation patterns for the PKM Review Application. The system is designed as a modern web application using Next.js 14+, PostgreSQL with Prisma ORM, and Supabase for authentication and file storage.

---

## 2. Technology Stack

### 2.1 Frontend

#### **Framework**: Next.js 14+ (App Router)
- **Why**: Server-side rendering, excellent DX, component-based architecture
- **Version**: Next.js 14.x or latest
- **Rendering Strategy**: 
  - Server Components for SEO-critical pages
  - Client Components for interactive features
  - Static generation for public pages
- **Note**: Frontend ONLY (no API routes used)

#### **Language**: TypeScript
- **Version**: 5.x
- **Why**: Type safety, better IDE support, fewer runtime errors

#### **UI Framework**: React 18+
- **Why**: Component-based, large ecosystem, team familiarity

#### **Styling**: TailwindCSS + Shadcn/ui
- **TailwindCSS**: Utility-first CSS framework
- **Shadcn/ui**: Copy-paste component library built on Radix UI
- **Why**: Rapid development, consistent design, highly customizable

#### **State Management**: Zustand
- **Why**: Lightweight, simple API, no boilerplate, TypeScript-first
- **Alternative**: React Context for simple cases
- **Use Cases**: 
  - Global user state
  - UI state (modals, sidebars)
  - Form state for complex multi-step forms

#### **Forms**: React Hook Form + Zod
- **React Hook Form**: Performance-focused form library
- **Zod**: TypeScript-first schema validation
- **Why**: Type-safe validation, great DX, minimal re-renders

#### **Data Fetching**: TanStack Query (React Query)
- **Why**: Caching, background refetching, optimistic updates
- **Integration**: Fetch data from NestJS API
- **Use Cases**:
  - Server state management
  - API data caching
  - Mutations with rollback

#### **PDF Viewer**: React-PDF
- **Library**: `react-pdf` (based on PDF.js)
- **Why**: Full-featured, annotation support via plugins
- **Features Needed**:
  - Render PDF
  - Text selection and highlight
  - Coordinate-based annotations
  - Multi-page navigation

#### **Charts**: Recharts
- **Why**: React-first, responsive, good documentation
- **Use Cases**: Admin dashboard statistics

---

### 2.2 Backend

#### **Framework**: NestJS 10+
- **Why**: Enterprise-grade, TypeScript-native, modular architecture, excellent for scalable APIs
- **Features**:
  - Built-in dependency injection
  - Decorator-based routing
  - Middleware & Guards for auth
  - Built-in validation with class-validator
  - Swagger/OpenAPI auto-generation

#### **Runtime**: Node.js 18+ LTS
- **Why**: Long-term support, stable, excellent ecosystem

#### **API Pattern**: RESTful API
- **Structure**: Module-based architecture
- **Validation**: Class-validator + class-transformer
- **Documentation**: Auto-generated Swagger UI

#### **Database**: PostgreSQL 15+
- **Why**: Robust, ACID compliant, excellent JSON support, mature
- **Hosting**: Self-hosted via Docker (Supabase Stack)

#### **ORM**: Prisma 5+
- **Why**: Type-safe queries, excellent migrations, schema as code
- **Features**:
  - Auto-generated types
  - Migration system
  - Prisma Studio for DB GUI
- **Integration**: NestJS Prisma Module

#### **Authentication**: Supabase Auth (via Supabase CLI)
- **Why**: Built-in solution, JWT-based, Row Level Security (RLS)
- **Local Development**: Supabase CLI (`npx supabase start`)
- **Production**: Self-hosted via official Docker Compose
- **Features**:
  - Email/password authentication
  - Session management (JWT)
  - User metadata storage
  - Security best practices out-of-box
- **Integration**: NestJS Guard for JWT validation

#### **File Storage**: Supabase Storage (via Supabase CLI)
- **Why**: S3-compatible, integrated with Supabase Auth, RLS for files
- **Local Development**: Supabase CLI (`npx supabase start`)
- **Production**: Self-hosted via official Docker Compose
- **Bucket Structure**:
  ```
  proposals/
    ├── original/
    │   └── {team_id}/{timestamp}_{filename}.pdf
    └── revised/
        └── {team_id}/{timestamp}_{filename}.pdf
  
  templates/
    └── {jenis_pkm_id}/{filename}.pdf
  ```

---

### 2.3 Infrastructure & Deployment

#### **Architecture**: Microservices (Frontend + Backend Separated)

```
┌─────────────────┐
│   Next.js App   │  (Frontend - Port 3000)
│   (React SPA)   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   NestJS API    │  (Backend - Port 4000)
│  (REST Server)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│     Supabase Stack (via Supabase CLI)               │
│  ┌──────────────┐  ┌──────────────────────────┐    │
│  │ PostgreSQL   │  │ All Supabase Services    │    │
│  │ (Port 54322) │  │ (Port 54321)             │    │
│  └──────────────┘  │ - Auth  - Storage        │    │
│  ┌──────────────┐  │ - REST  - Realtime       │    │
│  │ Studio UI    │  └──────────────────────────┘    │
│  │ (Port 54323) │                                   │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

**Local Development**:
- Managed by `npx supabase start` (Supabase CLI)
- All services auto-configured with proper migrations
- Includes Supabase Studio for database management

**Production**:
- Official Supabase Docker Compose from GitHub repository
- Manual configuration with production secrets

#### **Deployment Target**: VPS (Self-Hosted)
- **Provider Options**: DigitalOcean, Linode, AWS EC2, Hetzner, etc.
- **Recommended Specs** (Production):
  - CPU: 4 vCPUs
  - RAM: 8GB
  - Storage: 100GB SSD
  - OS: Ubuntu 22.04 LTS

#### **Container Orchestration**: Docker + Docker Compose
- **Development**: Supabase CLI (auto-managed Docker containers)
- **Production**: Docker Compose for all services
- **Services**:
  - Frontend (Next.js)
  - Backend (NestJS)
  - Supabase Stack (PostgreSQL, Auth, Storage, Realtime, etc.)
  - Nginx (Reverse Proxy - production only)

#### **Reverse Proxy**: Nginx
- **Why**: Battle-tested, high performance, SSL termination
- **Features**:
  - SSL/TLS with Let's Encrypt
  - Load balancing (for future scaling)
  - Static file serving
  - Request routing:
    - `/api/*` → NestJS Backend
    - `/*` → Next.js Frontend

#### **SSL/TLS**: Let's Encrypt (Certbot)
- **Why**: Free, automated renewal
- **Integration**: Nginx SSL configuration

#### **Process Management**: Docker Compose + systemd
- **Auto-restart**: systemd service for docker-compose
- **Health checks**: Docker health checks per service

---

### 2.4 DevOps & CI/CD

#### **Version Control**: Git + GitHub
- **Branching Strategy**: Git Flow
  - `main`: Production
  - `develop`: Development
  - `feature/*`: Feature branches
  - `hotfix/*`: Production hotfixes

#### **CI/CD**: GitHub Actions
- **Pipeline for Backend (NestJS)**:
  1. Lint (ESLint)
  2. Type check (TypeScript)
  3. Build (NestJS)
  4. Test (Jest)
  5. Build Docker image
  6. Push to registry (optional)
  7. Deploy to VPS via SSH

- **Pipeline for Frontend (Next.js)**:
  1. Lint (ESLint, Prettier)
  2. Type check (TypeScript)
  3. Build (Next.js)
  4. Build Docker image
  5. Deploy to VPS via SSH

#### **Environment Management**:
- **Development**: Local Docker + local PostgreSQL
- **Staging**: VPS staging server
- **Production**: VPS production server

#### **Monitoring** (Recommended):
- **Application**: PM2 logs or Docker logs
- **Server**: Prometheus + Grafana
- **Uptime**: UptimeRobot or similar

---

## 3. Application Architecture

### 3.1 Project Structure (Next.js App Router)

```
/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Dashboard route group
│   │   ├── mahasiswa/
│   │   │   ├── page.tsx          # Dashboard mahasiswa
│   │   │   ├── team/
│   │   │   └── proposal/
│   │   ├── reviewer/
│   │   │   ├── page.tsx          # Dashboard reviewer
│   │   │   └── review/
│   │   └── admin/
│   │       ├── page.tsx          # Dashboard admin
│   │       ├── users/
│   │       ├── master-data/
│   │       └── config/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── teams/
│   │   ├── proposals/
│   │   ├── reviews/
│   │   └── admin/
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── ui/                       # Shadcn/ui components
│   ├── features/                 # Feature-specific components
│   │   ├── team/
│   │   ├── proposal/
│   │   ├── review/
│   │   └── admin/
│   └── shared/                   # Shared components
├── lib/                          # Utility libraries
│   ├── prisma.ts                 # Prisma client singleton
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   ├── auth.ts                   # Auth utilities
│   └── utils.ts                  # General utilities
├── hooks/                        # Custom React hooks
├── stores/                       # Zustand stores
├── types/                        # TypeScript types
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # DB migrations
│   └── seed.ts                   # Seed data
├── public/                       # Static assets
├── .env.local                    # Local environment variables
├── .env.example                  # Example env variables
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

---

### 3.2 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant NextAPI
    participant Supabase
    participant Database

    User->>Frontend: Submit login (email+password)
    Frontend->>NextAPI: POST /api/auth/login
    NextAPI->>Supabase: signInWithPassword()
    Supabase-->>NextAPI: Session + JWT
    NextAPI->>Database: Get user profile (mahasiswa/reviewer)
    Database-->>NextAPI: User data
    NextAPI-->>Frontend: Set cookies + user data
    Frontend-->>User: Redirect to dashboard
```

**Session Management**:
- JWT stored in HTTP-only cookies
- Refresh token rotation
- Session timeout: 8 hours (configurable)
- Auto-logout on token expiration

---

### 3.3 File Upload Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant NextAPI
    participant Supabase Storage
    participant Database

    User->>Frontend: Select PDF file
    Frontend->>Frontend: Validate (size, type)
    Frontend->>NextAPI: POST /api/proposals/upload
    NextAPI->>NextAPI: Validate auth & team
    NextAPI->>Supabase Storage: Upload file
    Supabase Storage-->>NextAPI: File path
    NextAPI->>Database: Create proposal_file record
    Database-->>NextAPI: Success
    NextAPI-->>Frontend: Proposal updated
    Frontend-->>User: Show success
```

**File Upload Constraints**:
- Max file size: 10MB (enforced at both client & server)
- MIME type: `application/pdf` only
- Filename sanitization: Remove special characters
- Path structure: `proposals/{type}/{team_id}/{timestamp}_{filename}.pdf`

---

### 3.4 PDF Annotation Architecture

**Components**:
1. **PDF Viewer** (react-pdf)
   - Renders PDF pages
   - Handles text selection
   - Displays existing annotations

2. **Annotation Toolbar**
   - Highlight tool
   - Comment tool
   - Color picker (for reviewer distinction)

3. **Annotation Layer**
   - Overlays on PDF canvas
   - SVG-based highlights
   - Positioned using coordinates

**Data Structure** (stored in `pdf_annotation.annotation_data` JSONB):
```typescript
{
  coordinates: {
    x: number,      // X position (px or %)
    y: number,      // Y position
    width: number,  // Width of highlight
    height: number  // Height of highlight
  },
  text: string,           // Highlighted text or comment
  color: string,          // Hex color (#FFFF00)
  reviewer_number: 1 | 2  // Distinguish reviewers
}
```

**Rendering Strategy**:
- Load annotations by `proposal_file_id`
- Group by `page_number`
- Render SVG overlay per page
- Color-code by `reviewer_number`

---

## 4. Data Flow Patterns

### 4.1 Server Components (Data Fetching)

```typescript
// app/mahasiswa/team/[id]/page.tsx
import { prisma } from '@/lib/prisma';

export default async function TeamDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const team = await prisma.team.findUnique({
    where: { id: BigInt(params.id) },
    include: {
      teamMembers: {
        include: { mahasiswa: true }
      },
      proposals: {
        include: { proposalFiles: true }
      }
    }
  });

  return <TeamDetail team={team} />;
}
```

### 4.2 Client Components (Mutations)

```typescript
// components/features/team/TeamForm.tsx
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

export function TeamForm() {
  const queryClient = useQueryClient();
  
  const createTeam = useMutation({
    mutationFn: (data: TeamFormData) => 
      fetch('/api/teams', {
        method: 'POST',
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
    }
  });

  // Form implementation
}
```

### 4.3 API Route Pattern

```typescript
// app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // 2. Validate input
    const body = await request.json();
    // ... Zod validation

    // 3. Business logic
    const team = await prisma.team.create({
      data: {
        namaTeam: body.namaTeam,
        judulProposal: body.judulProposal,
        jenisPkmId: body.jenisPkmId,
        createdBy: user.id,
        teamMembers: {
          create: {
            mahasiswaId: user.mahasiswaId,
            role: 'ketua'
          }
        }
      }
    });

    // 4. Return response
    return NextResponse.json(team, { status: 201 });
    
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

---

## 5. Security Architecture

### 5.1 Authentication & Authorization

**Row Level Security (RLS)** - Supabase:
```sql
-- Example: Mahasiswa can only see their own data
CREATE POLICY "mahasiswa_select_own" ON mahasiswa
  FOR SELECT
  USING (auth.uid() = user_id);

-- Team members can see their team's data
CREATE POLICY "team_member_select" ON team
  FOR SELECT
  USING (
    id IN (
      SELECT team_id FROM team_member 
      WHERE mahasiswa_id IN (
        SELECT id FROM mahasiswa WHERE user_id = auth.uid()
      )
    )
  );
```

**API Route Protection**:
```typescript
// Middleware pattern
export async function withAuth(
  handler: (req: NextRequest, user: User) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    return handler(req, user);
  };
}

// Usage
export const POST = withAuth(async (req, user) => {
  // Handler logic
});
```

**Role-Based Access Control (RBAC)**:
```typescript
type UserRole = 'mahasiswa' | 'reviewer' | 'admin';

export function requireRole(allowedRoles: UserRole[]) {
  return async (req: NextRequest) => {
    const user = await getUser(req);
    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      );
    }
    // Continue...
  };
}
```

---

### 5.2 Input Validation

**Server-Side Validation** (Zod):
```typescript
import { z } from 'zod';

const TeamCreateSchema = z.object({
  namaTeam: z.string().min(3).max(255),
  judulProposal: z.string().min(10),
  jenisPkmId: z.string().transform(val => BigInt(val)),
  dosenPembimbingId: z.string().optional()
});

// In API route
const validated = TeamCreateSchema.parse(body);
```

**File Upload Validation**:
```typescript
const FileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(file => file.type === 'application/pdf', {
      message: 'Only PDF files allowed'
    })
    .refine(file => file.size <= 10 * 1024 * 1024, {
      message: 'Max file size 10MB'
    })
});
```

---

### 5.3 SQL Injection Prevention

- ✅ Prisma ORM (parameterized queries automatically)
- ✅ No raw SQL queries (unless absolutely necessary)
- ✅ Input sanitization via Zod

---

### 5.4 XSS Prevention

- ✅ React auto-escapes content
- ✅ Sanitize user input on server
- ✅ Content Security Policy (CSP) headers
- ✅ HTTP-only cookies for sessions

---

## 6. Performance Optimization

### 6.1 Database Optimization

**Indexes** (Already defined in Prisma schema):
- Foreign keys auto-indexed
- Search fields (nim, email) indexed
- Status fields for filtering indexed

**Query Optimization**:
```typescript
// Good: Use includes for relations
const team = await prisma.team.findUnique({
  where: { id },
  include: { teamMembers: true }
});

// Bad: N+1 query problem
const teams = await prisma.team.findMany();
for (const team of teams) {
  const members = await prisma.teamMember.findMany({
    where: { teamId: team.id }
  });
}
```

**Connection Pooling**:
- Prisma handles connection pooling automatically
- Configure in `DATABASE_URL`: `?connection_limit=10&pool_timeout=20`

---

### 6.2 Frontend Optimization

**Code Splitting**:
- Next.js automatic code splitting per page
- Dynamic imports for heavy components:
  ```typescript
  const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
    ssr: false,
    loading: () => <Skeleton />
  });
  ```

**Image Optimization**:
- Use Next.js `<Image>` component
- Lazy loading images
- WebP format with fallback

**Caching Strategy** (TanStack Query):
```typescript
const { data } = useQuery({
  queryKey: ['team', teamId],
  queryFn: () => fetchTeam(teamId),
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

---

### 6.3 File Serving

**PDF Streaming**:
- Stream large PDFs instead of loading fully
- Use range requests for partial content
- Implement pagination for PDF viewer

**CDN**:
- Supabase Storage uses CDN automatically
- Edge caching for static files

---

## 7. Error Handling & Logging

### 7.1 Error Handling Pattern

```typescript
// API route error handling
try {
  // Business logic
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Unique constraint violation' },
        { status: 409 }
      );
    }
  }
  
  // Log error
  console.error('Unexpected error:', error);
  
  // Generic error response (don't leak details)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### 7.2 Logging Strategy

**Development**:
- Console logging
- Detailed error stacks

**Production**:
- Structured logging (JSON format)
- Error tracking service (Sentry recommended)
- Log levels: ERROR, WARN, INFO, DEBUG

---

## 8. Testing Strategy (Optional)

### 8.1 Unit Testing
- **Framework**: Vitest or Jest
- **Target**: Utility functions, business logic
- **Coverage**: Aim for 70%+

### 8.2 Integration Testing
- **API Routes**: Test with mocked database
- **Components**: React Testing Library

### 8.3 E2E Testing
- **Framework**: Playwright (recommended)
- **Critical Flows**:
  - Login
  - Team creation
  - Proposal upload
  - Review submission

---

## 9. Deployment Configuration

### 9.1 Environment Variables

```bash
# .env.example
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# File Upload
MAX_FILE_SIZE_MB=10
```

### 9.2 Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['xxx.supabase.co'], // Supabase storage domain
  },
  experimental: {
    serverActions: true, // Enable Server Actions
  },
  // Disable source maps in production (optional)
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
```

---

## 10. Scalability Considerations

### 10.1 Horizontal Scaling
- Vercel Edge Functions scale automatically
- Stateless API design (no in-memory sessions)
- Database connection pooling

### 10.2 Caching Layers
- **Browser**: React Query cache
- **CDN**: Vercel Edge Network
- **Database**: Redis cache (future enhancement)

### 10.3 Future Enhancements
- Real-time notifications (Supabase Realtime)
- Background jobs (Vercel Cron or BullMQ)
- Elasticsearch for proposal search (if needed)

---

## 11. Development Workflow

### 11.1 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/org/pkm-review.git
cd pkm-review

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run Prisma migrations
npx prisma migrate dev

# 5. Seed database (optional)
npx prisma db seed

# 6. Start dev server
npm run dev
```

### 11.2 Database Migrations

```bash
# Create migration after schema changes
npx prisma migrate dev --name add_new_field

# Apply migrations in production
npx prisma migrate deploy
```

### 11.3 Git Workflow

```bash
# Create feature branch
git checkout -b feature/team-management

# Make changes and commit
git add .
git commit -m "feat: add team creation"

# Push and create PR
git push origin feature/team-management
```

---

## 12. Monitoring & Maintenance

### 12.1 Application Monitoring
- **Vercel Analytics**: Page views, performance
- **Sentry**: Error tracking (recommended)
- **Prisma Query Logs**: Slow query detection

### 12.2 Database Maintenance
- **Backups**: Daily automated via Supabase
- **Migration History**: Tracked in `prisma/migrations`
- **Query Performance**: Monitor via Supabase dashboard

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-02  
**Author**: Development Team
