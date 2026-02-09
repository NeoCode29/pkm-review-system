# Git Workflow Guide
## PKM Review Application

> **Purpose**: Standardize version control practices for consistent collaboration.

---

## 🌳 Branching Strategy: Git Flow

### Branch Types

```
main (production)
  ↑
develop (integration)
  ↑
feature/* (new features)
hotfix/* (urgent production fixes)
release/* (production preparation)
```

---

## 📝 Branch Naming Conventions

### Format
```
<type>/<ticket-id>-<short-description>
```

### Types
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Production urgent fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation only
- `test/` - Adding tests
- `chore/` - Build, dependencies, etc.

### Examples
```bash
feature/PKM-123-team-creation
bugfix/PKM-456-fix-login-error
hotfix/PKM-789-critical-security-patch
refactor/cleanup-auth-service
docs/update-api-documentation
test/add-team-service-tests
chore/upgrade-dependencies
```

---

## 🔄 Workflow Steps

### 1. Starting New Work

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/PKM-123-team-creation

# Start coding...
```

---

### 2. During Development

```bash
# Check status frequently
git status

# Stage changes
git add .

# Commit with conventional message
git commit -m "feat(teams): add team creation endpoint"

# Push to remote
git push origin feature/PKM-123-team-creation
```

---

### 3. Ready for Review

```bash
# Update from develop (rebase)
git checkout develop
git pull origin develop
git checkout feature/PKM-123-team-creation
git rebase develop

# If conflicts, resolve then:
git add .
git rebase --continue

# Force push (after rebase)
git push origin feature/PKM-123-team-creation --force-with-lease
```

---

### 4. Create Pull Request

**On GitHub**:
1. Go to repository
2. Click "New Pull Request"
3. Base: `develop` ← Compare: `feature/PKM-123-team-creation`
4. Fill PR template (see below)
5. Request reviewers
6. Link related issues/tickets

---

### 5. After Approval

```bash
# Merge via GitHub (Squash and Merge recommended)
# Then delete branch on GitHub

# Locally, clean up
git checkout develop
git pull origin develop
git branch -d feature/PKM-123-team-creation
```

---

## 📋 Commit Message Convention

### Format (Conventional Commits)

```
<type>(<scope>): <subject>

<body> (optional)

<footer> (optional)
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(teams): add team invite` |
| `fix` | Bug fix | `fix(auth): resolve token expiry` |
| `docs` | Documentation | `docs(api): update endpoint docs` |
| `style` | Code style (formatting) | `style: format with prettier` |
| `refactor` | Code refactoring | `refactor(teams): extract validation` |
| `test` | Add/update tests | `test(teams): add service tests` |
| `chore` | Build, dependencies | `chore: upgrade prisma to v5` |
| `perf` | Performance improvement | `perf(api): optimize query` |
| `ci` | CI/CD changes | `ci: add test workflow` |

### Scope

Optional, indicates affected module:
- `teams`
- `proposals`
- `reviews`
- `auth`
- `admin`
- `ui`

### Examples

```bash
# ✅ Good commits
git commit -m "feat(teams): implement team creation API endpoint"
git commit -m "fix(auth): resolve JWT token expiration issue"
git commit -m "docs(readme): add setup instructions"
git commit -m "test(proposals): add unit tests for proposal service"

# ❌ Bad commits
git commit -m "update stuff"
git commit -m "fix bug"
git commit -m "WIP"
git commit -m "asdfasdf"
```

### Multi-line Commits

```bash
git commit -m "feat(teams): add team member management

- Add endpoint to add team members
- Add endpoint to remove team members
- Validate team size constraints (3-5 members)
- Add comprehensive tests

Closes #123"
```

---

## 🔍 Pull Request Template

**Create**: `.github/pull_request_template.md`

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 📝 Documentation update
- [ ] 🔨 Refactoring
- [ ] ✅ Tests

## Related Issues
Closes #123

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing Done
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed the code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Tests pass locally
- [ ] Dependent changes merged

## Screenshots (if applicable)
Before:
After:

## Additional Notes
Any additional context or notes.
```

---

## 👀 Code Review Guidelines

### For Reviewers

**What to Check**:
- [ ] Code follows style guide
- [ ] Business rules enforced correctly
- [ ] Proper error handling
- [ ] Security considerations
- [ ] Performance implications
- [ ] Tests are comprehensive
- [ ] Documentation updated
- [ ] No hard-coded secrets

**How to Review**:
```bash
# Checkout PR branch
git fetch origin
git checkout feature/PKM-123-team-creation

# Run tests
npm test

# Test manually
npm run start:dev

# Review code on GitHub with inline comments
```

**Review Comments**:
- Be constructive and specific
- Suggest improvements with examples
- Approve if minor changes needed
- Request changes if major issues

---

### For Authors

**Before Requesting Review**:
- [ ] All tests pass
- [ ] Code is self-reviewed
- [ ] Documentation updated
- [ ] No console.logs or debugging code
- [ ] Commits are clean and meaningful

**Responding to Feedback**:
- Address all comments
- Push changes as new commits
- Re-request review when done
- Thank reviewers for feedback

---

## 🚨 Emergency Hotfix Process

### When Production is Broken

```bash
# 1. Branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-auth-bug

# 2. Fix the issue
# ... make changes ...

# 3. Commit
git add .
git commit -m "hotfix(auth): fix critical JWT validation bug"

# 4. Push
git push origin hotfix/critical-auth-bug

# 5. Create PR to BOTH main AND develop
# PR 1: hotfix/critical-auth-bug → main
# PR 2: hotfix/critical-auth-bug → develop

# 6. After merge, tag release
git checkout main
git pull origin main
git tag -a v1.0.1 -m "Hotfix: Critical auth bug"
git push origin v1.0.1

# 7. Clean up
git branch -d hotfix/critical-auth-bug
```

---

## 🏷️ Versioning & Releases

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (v2.0.0)
- **MINOR**: New features, backward compatible (v1.1.0)
- **PATCH**: Bug fixes (v1.0.1)

### Release Process

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.1.0

# 2. Update version
# Update package.json version
# Update CHANGELOG.md

# 3. Commit version bump
git commit -am "chore(release): bump version to 1.1.0"

# 4. Merge to main
git checkout main
git merge release/v1.1.0

# 5. Tag release
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin main --tags

# 6. Merge back to develop
git checkout develop
git merge release/v1.1.0
git push origin develop

# 7. Delete release branch
git branch -d release/v1.1.0
```

---

## 🔧 Useful Git Commands

### Undo Changes

```bash
# Undo uncommitted changes
git checkout -- <file>
git reset --hard HEAD

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Amend last commit message
git commit --amend -m "New message"
```

### Stash Changes

```bash
# Save work in progress
git stash save "WIP: feature description"

# List stashes
git stash list

# Apply stash
git stash apply stash@{0}

# Apply and remove stash
git stash pop
```

### Clean Branches

```bash
# List merged branches
git branch --merged develop

# Delete merged local branches
git branch --merged develop | grep -v "develop" | xargs git branch -d

# Prune deleted remote branches
git fetch --prune
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ Don't Do This

```bash
# Don't commit to main/develop directly
git checkout main
git commit -m "fix" # ❌

# Don't force push to shared branches
git push origin develop --force # ❌

# Don't use generic commit messages
git commit -m "update" # ❌
git commit -m "fix bug" # ❌

# Don't commit secrets
git add .env # ❌
```

### ✅ Do This Instead

```bash
# Use feature branches
git checkout -b feature/my-feature

# Use conventional commits
git commit -m "feat(teams): add team creation"

# Rebase and force push only feature branches
git push origin feature/my-feature --force-with-lease

# Never commit secrets
# Add to .gitignore
echo ".env" >> .gitignore
```

---

## 📚 Git Aliases (Optional)

Add to `~/.gitconfig`:

```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    cm = commit -m
    pl = pull
    ps = push
    rb = rebase
    lg = log --graph --oneline --all
    undo = reset --soft HEAD~1
```

Usage:
```bash
git st    # instead of git status
git co develop
git cm "feat: add feature"
```

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| New feature | `git checkout -b feature/name` |
| Commit | `git commit -m "type(scope): message"` |
| Update branch | `git rebase develop` |
| Push | `git push origin branch-name` |
| Create PR | On GitHub UI |
| Clean up | `git branch -d branch-name` |

---

**Consistent Git workflow = Happy team!** 🚀
