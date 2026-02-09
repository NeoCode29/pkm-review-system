# PKM Review - Style Guide Documentation

Dokumentasi style guide untuk frontend development aplikasi PKM Review.

---

## 🎨 Color System

### Role-Based Theme Colors

| Role | Primary Color | Background | Hover |
|------|--------------|------------|-------|
| **Mahasiswa** | `#1565c0` (Blue) | `#e3f2fd` | `#1976d2` |
| **Reviewer** | `#f57c00` (Orange) | `#fff3e0` | `#ff9800` |
| **Admin** | `#333333` (Dark Gray) | `#eeeeee` | `#444444` |

### Semantic Colors

```css
/* Status Colors */
--color-success: #388e3c;
--color-success-bg: #e8f5e9;

--color-warning: #f9a825;
--color-warning-bg: #fff9c4;

--color-danger: #d32f2f;
--color-danger-bg: #ffebee;

--color-info: #1565c0;
--color-info-bg: #e3f2fd;

/* Neutral Colors */
--color-gray: #666666;
--color-gray-bg: #f5f5f5;
--color-border: #dddddd;
--color-text: #000000;
--color-text-muted: #666666;
```

---

## 📐 Typography

```css
/* Font Family */
font-family: Arial, sans-serif;

/* Font Sizes */
--font-size-xs: 11px;   /* Badge small */
--font-size-sm: 12px;   /* Badge, help text */
--font-size-md: 14px;   /* Body, buttons, sidebar */
--font-size-lg: 16px;   /* Titles, headings */
--font-size-xl: 18px;   /* Page title */
--font-size-2xl: 24px;  /* Main title */
--font-size-3xl: 28px;  /* Stat numbers */
```

---

## 📏 Spacing

```css
/* Spacing Scale */
--spacing-1: 2px;
--spacing-2: 5px;
--spacing-3: 10px;
--spacing-4: 15px;
--spacing-5: 20px;
--spacing-6: 30px;

/* Common Usage */
--padding-box: 20px;
--padding-card: 15px;
--margin-section: 20px;
--gap-grid: 15px;
```

---

## 🧩 Components

### Buttons

```html
<!-- Default Button -->
<button class="button">Default</button>

<!-- Primary Button -->
<button class="button button-primary">Primary</button>

<!-- Danger Button -->
<button class="button button-danger">Delete</button>

<!-- Success Button -->
<button class="button button-success">Approve</button>

<!-- Small Button -->
<button class="button button-sm">Small</button>
```

**CSS Properties:**
```css
.button {
    padding: 10px 20px;
    border: 2px solid [theme-color];
    font-size: 14px;
}

.button-sm {
    padding: 6px 12px;
}
```

---

### Badges

```html
<!-- Status Badges -->
<span class="badge badge-green">✓ Done</span>
<span class="badge badge-yellow">In Progress</span>
<span class="badge badge-red">Failed</span>
<span class="badge badge-blue">Info</span>
<span class="badge badge-gray">Draft</span>

<!-- PKM Type Badges -->
<span class="badge badge-blue">PKM-KC</span>
<span class="badge badge-yellow">PKM-GT</span>
```

**CSS Properties:**
```css
.badge {
    display: inline-block;
    padding: 4px 10px;
    border: 2px solid;
    font-size: 12px;
    white-space: nowrap;
}
```

---

### Tables

```html
<div class="table-scroll-wrapper">
    <table class="table">
        <thead>
            <tr>
                <th>Column 1</th>
                <th>Column 2</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Data 1</td>
                <td>Data 2</td>
                <td>
                    <button class="button button-sm">Edit</button>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

**Responsive Behavior:**
- Mobile: Horizontal scroll enabled
- First column: Sticky on scroll
- Action column: No text wrap

---

### Cards & Boxes

```html
<!-- Box Component -->
<div class="box">
    <div class="box-title">Section Title</div>
    <!-- Content here -->
</div>

<!-- Card Component -->
<div class="card">
    <div class="card-header">Card Title</div>
    <div class="card-body">Content</div>
    <div class="card-footer">Footer</div>
</div>
```

---

### Alerts

```html
<div class="alert alert-success">Success message</div>
<div class="alert alert-warning">Warning message</div>
<div class="alert alert-error">Error message</div>
<div class="alert alert-info">Info message</div>
```

**CSS Properties:**
```css
.alert {
    padding: 15px 20px;
    border: 3px solid;
    margin-bottom: 20px;
}
```

---

### Form Elements

```html
<!-- Input Field -->
<label class="label">Label <span class="required">*</span></label>
<input type="text" class="input-field" placeholder="Enter text...">
<p class="help-text">Helper text here</p>

<!-- Select -->
<select class="input-field">
    <option>Option 1</option>
    <option>Option 2</option>
</select>

<!-- Form Group -->
<div class="form-group">
    <label class="label">Field Label</label>
    <input type="text" class="input-field">
</div>
```

---

### Stats Box

```html
<div class="stat-box">
    <div class="number">42</div>
    <div class="stat-label">Total Items</div>
</div>
```

---

### Grid System

```html
<!-- 2 Column Grid -->
<div class="grid-2col">
    <div>Column 1</div>
    <div>Column 2</div>
</div>

<!-- 3 Column Grid -->
<div class="grid-3col">...</div>

<!-- 4 Column Grid -->
<div class="grid-4col">...</div>
```

**Responsive:**
- `grid-4col`: 4 → 2 → 1 columns
- `grid-3col`: 3 → 2 → 1 columns
- `grid-2col`: 2 → 1 columns

---

## 📱 Responsive Breakpoints

```css
/* Tablet */
@media (max-width: 768px) {
    /* Sidebar: 180px width */
    /* Grid: Reduce columns */
    /* Content padding: 20px */
}

/* Mobile */
@media (max-width: 576px) {
    /* Sidebar: Off-canvas drawer */
    /* Grid: Single column */
    /* Content padding: 15px */
    /* Show mobile menu toggle */
}
```

---

## 🏗️ Layout Structure

```html
<body>
    <!-- Top Navigation -->
    <nav class="top-nav">
        <h1>App Title</h1>
        <div class="user-info">User Info</div>
    </nav>

    <!-- Mobile Overlay (for sidebar) -->
    <div class="mobile-overlay" id="mobileOverlay"></div>

    <!-- Main Layout -->
    <div class="layout">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <h3>Menu</h3>
            <a href="#" class="sidebar-item active">Menu Item</a>
            <a href="#" class="sidebar-item">Menu Item</a>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <div class="page-title">Page Title</div>
            <!-- Page content here -->
        </main>
    </div>
</body>
```

---

## 📱 Mobile Menu JavaScript

```javascript
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('mobileOverlay').classList.toggle('show');
}

// Close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('mobileOverlay').classList.remove('show');
    }
});
```

---

## 📂 File Structure

```
wireframes/
├── mahasiswa/
│   └── pages/
│       ├── styles.css      # Mahasiswa styles (blue theme)
│       ├── login.html
│       ├── dashboard.html
│       └── ...
├── admin/
│   └── pages/
│       ├── styles.css      # Admin styles (dark theme)
│       └── ...
├── reviewer/
│   └── pages/
│       ├── styles.css      # Reviewer styles (orange theme)
│       └── ...
└── design-test/
    ├── styles.css          # Component demos
    └── *.html              # Demo pages
```

---

## ✅ Implementation Checklist

When implementing in frontend framework:

- [ ] Define CSS variables for colors
- [ ] Create reusable button components
- [ ] Create badge components
- [ ] Implement responsive table wrapper
- [ ] Create form input components
- [ ] Implement grid layout system
- [ ] Add mobile sidebar with overlay
- [ ] Apply role-based theming
