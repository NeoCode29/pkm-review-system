# Frontend Development Journal
## PKM Review Application - Next.js

> **Purpose**: Track frontend development progress, issues, and learnings.

---

## 📝 Entry Template

```markdown
### [DATE] - [CATEGORY] Brief Title

**Context**: What were you working on?

**Issue/Decision**: What happened?

**Solution/Outcome**: How was it resolved?

**Code Example** (if applicable):
```typescript
// Code snippet
```

**Related Files**: 
- `path/to/component.tsx`

**Lessons Learned**:
- Key takeaway

---
```

---

## 📅 Development Log

### 2026-02-04 - [SETUP] Frontend Project Structure

**Context**: Initial frontend setup with Next.js 14 App Router

**Status**: Pending implementation

**Next Steps**:
- Install dependencies
- Configure Tailwind CSS
- Install Shadcn/ui components
- Setup folder structure

---

## 🔧 Common Frontend Issues & Solutions

### Issue: Hydration Mismatch

**Symptoms**:
```
Error: Hydration failed because the initial UI does not match...
```

**Common Causes**:
1. Using `localStorage` in server components
2. Date/time formatting differences
3. Random values in SSR

**Solution**:
```typescript
// Use client component for localStorage
'use client'

import { useEffect, useState } from 'react'

export function ClientOnlyComponent() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return <div>{/* Access localStorage here */}</div>
}
```

---

### Issue: PDF Viewer Not Loading

**Error**: `pdfjs worker not found`

**Solution**:
```typescript
import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
```

---

## 💡 Component Patterns Discovered

### Pattern: Modal with Form

```typescript
// Reusable pattern for modals with forms
export function CreateModal({ open, onOpenChange, onSuccess }) {
  const form = useForm()
  
  const handleSubmit = async (data) => {
    try {
      await createItem(data)
      onSuccess()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      // Handle error
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Form fields */}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🎯 Best Practices Learned

### TanStack Query Patterns

**Always invalidate related queries**:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['teams'] })
  queryClient.invalidateQueries({ queryKey: ['proposals'] }) // If related
}
```

---

## 📊 Progress Tracking

### Completed
- [ ] Project setup
- [ ] Authentication flow
- [ ] Component library setup

### In Progress
- [ ] Team management UI
- [ ] Proposal upload UI

### Not Started
- [ ] Review interface
- [ ] PDF annotation
- [ ] Admin dashboard

---

**Update this journal as you develop!** ✍️
