# Frontend Development Guide
## PKM Review Application - Next.js Frontend

> **Purpose**: Development guide specifically for frontend (Next.js) development. Follow these patterns for consistency.

---

## 🎯 Frontend Architecture

### Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **State**: Zustand (global) + React Context (local)
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **PDF Viewer**: React-PDF

---

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (mahasiswa)/       # Mahasiswa dashboard
│   ├── (reviewer)/        # Reviewer dashboard
│   ├── (admin)/           # Admin dashboard
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
│
├── components/            # React components
│   ├── ui/               # Shadcn/ui base components
│   ├── features/         # Feature-specific components
│   │   ├── teams/
│   │   ├── proposals/
│   │   ├── reviews/
│   │   └── admin/
│   └── shared/           # Shared components
│
├── lib/                  # Utilities
│   ├── api.ts           # API client
│   ├── auth.ts          # Auth utilities
│   └── utils.ts         # General utilities
│
├── hooks/               # Custom React hooks
│   ├── useAuth.ts
│   ├── useTeams.ts
│   └── useProposals.ts
│
├── stores/              # Zustand stores
│   ├── authStore.ts
│   └── uiStore.ts
│
└── types/               # TypeScript types
    └── index.ts
```

---

## 🔐 Authentication Flow

### Client-Side Auth with Supabase

```typescript
// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
```

### Auth Hook Pattern

```typescript
// hooks/useAuth.ts
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const { user, setUser, clearUser } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, isAuthenticated: !!user }
}
```

### Protected Routes

```typescript
// app/(mahasiswa)/layout.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { redirect } from 'next/navigation'

export default function MahasiswaLayout({ children }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    redirect('/login')
  }

  if (user?.role !== 'mahasiswa') {
    redirect('/unauthorized')
  }

  return <div>{children}</div>
}
```

---

## 📡 API Integration

### API Client Setup

```typescript
// lib/api.ts
import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = await getAuthToken()
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'API request failed')
  }

  return response.json()
}
```

### TanStack Query Integration

```typescript
// hooks/useTeams.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiCall } from '@/lib/api'

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => apiCall<Team[]>('/teams'),
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTeamDto) => 
      apiCall('/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}
```

---

## 🎨 Component Patterns

### Feature Component Structure

```typescript
// components/features/teams/TeamCard.tsx
'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Team } from '@/types'

interface TeamCardProps {
  team: Team
  onEdit?: (team: Team) => void
  onDelete?: (teamId: string) => void
}

export function TeamCard({ team, onEdit, onDelete }: TeamCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{team.namaTeam}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {team.judulProposal}
        </p>
        <div className="mt-4 flex gap-2">
          {onEdit && (
            <Button size="sm" onClick={() => onEdit(team)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => onDelete(team.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 📝 Form Handling

### React Hook Form + Zod Pattern

```typescript
// components/features/teams/CreateTeamForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useCreateTeam } from '@/hooks/useTeams'

const teamSchema = z.object({
  namaTeam: z.string().min(3).max(255),
  judulProposal: z.string().min(10),
  jenisPkmId: z.string(),
})

type TeamFormData = z.infer<typeof teamSchema>

export function CreateTeamForm() {
  const createTeam = useCreateTeam()
  
  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      namaTeam: '',
      judulProposal: '',
      jenisPkmId: '',
    },
  })

  const onSubmit = async (data: TeamFormData) => {
    try {
      await createTeam.mutateAsync(data)
      form.reset()
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="namaTeam"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Team</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="judulProposal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul Proposal</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createTeam.isPending}>
          {createTeam.isPending ? 'Creating...' : 'Create Team'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## 🗂️ State Management

### Zustand for Global State

```typescript
// stores/authStore.ts
import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
```

### React Context for Local State

```typescript
// app/(mahasiswa)/TeamContext.tsx
'use client'

import { createContext, useContext, useState } from 'react'

interface TeamContextValue {
  selectedTeamId: string | null
  setSelectedTeamId: (id: string | null) => void
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined)

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  return (
    <TeamContext.Provider value={{ selectedTeamId, setSelectedTeamId }}>
      {children}
    </TeamContext.Provider>
  )
}

export function useTeamContext() {
  const context = useContext(TeamContext)
  if (!context) {
    throw new Error('useTeamContext must be used within TeamProvider')
  }
  return context
}
```

---

## 🎨 Styling Guidelines

### Tailwind CSS Best Practices

```typescript
// ✅ Good: Semantic class grouping
<div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
  <h3 className="text-lg font-semibold">Title</h3>
  <Button variant="outline" size="sm">Action</Button>
</div>

// ❌ Bad: Random order, hard to read
<div className="p-4 gap-4 bg-card rounded-lg flex border items-center justify-between">
```

### Using Shadcn/ui Components

```typescript
// Always use Shadcn components for consistency
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'

// Customize via className when needed
<Button className="bg-primary hover:bg-primary/90">
  Custom Button
</Button>
```

---

## 📄 PDF Viewer Integration

### React-PDF Setup

```typescript
// components/features/proposals/PDFViewer.tsx
'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface PDFViewerProps {
  fileUrl: string
}

export function PDFViewer({ fileUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  return (
    <div className="flex flex-col items-center">
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
      >
        <Page pageNumber={pageNumber} />
      </Document>
      
      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
          disabled={pageNumber <= 1}
        >
          Previous
        </button>
        <span>
          Page {pageNumber} of {numPages}
        </span>
        <button
          onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
          disabled={pageNumber >= numPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

---

## 🚨 Error Handling

### Error Boundaries

```typescript
// components/ErrorBoundary.tsx
'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>
    }

    return this.props.children
  }
}
```

### API Error Handling

```typescript
// hooks/useTeams.ts
import { toast } from '@/components/ui/use-toast'

export function useCreateTeam() {
  return useMutation({
    mutationFn: createTeamApi,
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create team',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Team created successfully',
      })
    },
  })
}
```

---

## ✅ Best Practices

### Component Organization
- Keep components small and focused
- Use composition over prop drilling
- Separate presentational from container components

### Performance
- Use React.memo for expensive components
- Implement proper loading states
- Optimize images with Next.js Image component

### Accessibility
- Use semantic HTML
- Add proper ARIA labels
- Ensure keyboard navigation works

### Type Safety
- Define proper TypeScript types
- Avoid `any` type
- Use type inference where possible

---

## 🔗 Related Documentation

- [API Contract](../02-backend/API_CONTRACT.md) - Backend API
- [Business Rules](../02-backend/BUSINESS_RULES.md) - Business logic
- [Component Library](./COMPONENT_LIBRARY.md) - Shadcn/ui components

---

**Remember: Keep components simple, reusable, and well-typed!** 🚀
