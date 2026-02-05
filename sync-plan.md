# Elegant .prodman Sync Between Developers

## Problem Statement
Multiple developers working on the same project need to keep `.prodman/` in sync via git. The main challenges are:

1. **ID Counter Conflicts**: Sequential IDs stored in `config.yaml` cause conflicts when developers create items simultaneously
2. **YAML Merge Conflicts**: Concurrent edits to the same file
3. **Stale Data**: Developers may not have the latest changes before making modifications

## Solution: Sync-First with Collision Recovery

Keep clean sequential IDs (`EP-001`, `EP-002`) but prevent conflicts through **auto-sync** and handle edge cases with **collision recovery**.

---

## Core Changes

### 1. Auto-Pull Before ID Generation (Primary Defense)

Before creating any new item, automatically sync with remote:
```
prodman epic create
  → git fetch origin
  → if behind: git pull --rebase
  → generate ID from synced counter
  → create item
  → commit & push (if auto_push enabled)
```

This ensures you always have the latest counter before generating an ID.

**File**: `src/core/fs.ts` - wrap `generateId()` with sync check

### 2. Collision Recovery (Edge Case Handler)

If two developers create items at the exact same moment (rare but possible):
- Detect collision when file already exists
- Auto-increment to next available ID
- Update counter to reflect actual max

```typescript
// In writeEpic(), before writing:
if (existsSync(targetPath)) {
  // Collision! Find next available ID
  const maxId = findMaxId(epicsDir, "EP");
  epic.id = `EP-${String(maxId + 1).padStart(3, "0")}`;
  // Update counter
}
```

**File**: `src/core/fs.ts` - add collision detection to write functions

### 3. Add `.gitattributes` for Smart Merging

Create `.prodman/.gitattributes`:
```gitattributes
# Union merge for YAML (combines array additions)
*.yaml merge=union

# Standard merge for markdown (semantic conflicts matter)
*.md merge=text
```

This tells git to combine additive changes automatically (e.g., two devs adding different items to an array).

**File**: New file `.prodman/.gitattributes`, created by `init` command

### 4. Auto-Push After Create (Optional)

Complete the sync loop by pushing after creating:
```yaml
sync:
  auto_pull: true   # Pull before create operations
  auto_push: true   # Push after create operations (already exists)
```

This keeps all developers in sync automatically.

### 5. Git Hooks for Validation (Optional)

Add `prodman hooks install` command that creates:

**pre-commit**: Validate `.prodman/` files before commit
**post-merge**: Notify about `.prodman/` changes after pull

**File**: `src/cli/commands/hooks.ts` (new command)

---

## Implementation Plan

### Phase 1: Auto-Sync Before ID Generation
1. Add `ensureSynced()` function to `src/core/git.ts`:
   - Check if remote has new commits
   - Auto-pull with rebase if behind
   - Return sync status
2. Add `sync.auto_pull` to config schema
3. Wrap `generateId()` to call `ensureSynced()` first

### Phase 2: Collision Recovery
1. Add `findMaxId()` helper to scan existing files for highest ID
2. Modify `writeEpic()`, `writeIssue()`, etc. to detect collision
3. On collision: find next available ID, update counter, proceed

### Phase 3: Git Configuration
1. Update `init` command to create `.prodman/.gitattributes`
2. Configure union merge for YAML files

### Phase 4: Hooks (Optional)
1. Add `prodman hooks install` command
2. Create pre-commit and post-merge hook templates

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/core/git.ts` | Add `ensureSynced()`, `isRemoteAhead()` |
| `src/core/fs.ts` | Add collision detection, `findMaxId()` |
| `src/core/schemas/config.ts` | Add `sync.auto_pull` option |
| `src/cli/commands/init.ts` | Create `.gitattributes` on init |
| `src/cli/commands/hooks.ts` | New command for git hooks (optional) |

---

## Verification

1. **Test auto-sync**: Create item when remote is ahead, verify pull happens first
2. **Test collision recovery**: Simulate collision (manually create EP-015 file), create new epic, verify it becomes EP-016
3. **Test git merge**: Two devs modify different epics, merge cleanly with union strategy
4. **Test full workflow**: Dev A creates EP-015, Dev B (offline) creates EP-015, Dev B comes online and syncs - collision resolved

---

## Summary

| Problem | Solution |
|---------|----------|
| Counter conflicts | Auto-pull before ID generation |
| Same-second collision | Collision detection + auto-increment |
| YAML merge conflicts | `.gitattributes` with union merge |
| Keeping in sync | Auto-pull + optional auto-push |
| Validation | Git hooks (optional) |

This approach keeps the clean sequential ID format while preventing conflicts through proactive syncing and graceful collision recovery.
