# git-prodman Augmentation Roadmap
## Turning a Storage Tool Into a Workflow Engine

---

## Current State: Storage Layer ✅
```
.prodman/
├── product.yaml      ← What we're building
├── roadmap.yaml      ← When we're building it
├── epics/            ← Why we're building it
├── specs/            ← How we're building it
├── issues/           ← Work items
├── decisions/        ← Design decisions
└── signals/          ← (NEW) Why customers want it
```

**Problem**: These files exist in isolation. There's no engine to:
- Validate they're complete
- Connect them intelligently
- Auto-generate missing pieces
- Prevent rework

---

## Augmentation Layer: The Missing Pieces

### 1. SPEC QUALITY ENGINE (Highest ROI)
**Problem**: Engineers ask "this spec is unclear" → PM revises → repeat 3x

```
┌─────────────────────────────────────────────┐
│  New Agent: spec-validator                  │
├─────────────────────────────────────────────┤
│ Checks:                                     │
│ ✓ All acceptance criteria specific         │
│ ✓ No ambiguous words ("user-friendly")     │
│ ✓ Edge cases documented                    │
│ ✓ Dependencies declared                    │
│ ✓ Design linked (if UI)                    │
│ ✓ Performance requirements specified       │
│ ✓ Reviewed by ≥1 engineer                  │
└─────────────────────────────────────────────┘

$ prodman spec validate user-notifications.md
⚠️ Warning: 2 issues found:
  1. Acceptance criterion "ensure high performance" is vague (line 12)
  2. No performance metric specified (e.g., "<200ms p99")

Suggestion: Add "p99 latency: <200ms"
```

**Implementation**:
- New file: `.prodman/dod-templates.yaml` (DoD for different work types)
- New CLI: `prodman spec validate <spec>`
- New Web UI: "DoD Checklist" sidebar
- Auto-run on: `prodman sync` (blocks push if invalid)

**Impact**: Reduces spec review cycles from 3 rounds to 1

---

### 2. INTELLIGENT ISSUE BREAKDOWN (Biggest Time Saver)

**Problem**: PM writes 1 spec. Engineer has to mentally break it into tasks. Creates 5 issues. Asks clarifying questions.

```
BEFORE: 1 Spec → 1 Engineer → 1 Hour of thinking → 5 Issues (some wrong)

AFTER:  1 Spec → Agent → 30 seconds → 5 Issues + Dependencies + Estimates
```

**Command**:
```bash
$ prodman agent run break-it-down specs/user-notifications.md

Output:
✅ Created 5 issues with:
   - Exact acceptance criteria (extracted from spec)
   - Dependencies (Issue 88 blocks 91)
   - Effort estimates (S/M/L)
   - Suggested assignee (based on commit history)
   - Type labels (backend|frontend|design|devops)

Generated issues:
├── #88: Design notification data model (S) — no dependencies
├── #89: Create notification API endpoints (M) — depends on #88
├── #90: Integrate push provider (M) — depends on #88
├── #91: Build notification UI (M) — depends on #89
└── #92: Set notification preferences (S) — depends on #91
```

**Implementation**:
- New agent: `break-it-down`
- Prompt: Parse spec → Extract work items → Detect dependencies → Estimate effort
- Output: Auto-create issues in `.prodman/issues/open/`
- Integration: Link back to parent spec

**Code Structure**:
```typescript
// New file: src/agents/break-it-down.ts
async function breakItDownAgent(specPath: string) {
  const spec = parseMarkdown(specPath);

  const prompt = `
  Break this spec into implementation tasks:
  Title: ${spec.title}
  Overview: ${spec.body}
  Acceptance Criteria: ${spec.acceptance_criteria}

  For each task, provide:
  - Title (verb + object: "Create...", "Build...", "Design...")
  - Description (1 sentence)
  - Acceptance Criteria (2-3 specific criteria)
  - Effort (S/M/L)
  - Type (backend|frontend|design|devops)
  - Dependencies (list other issue numbers)

  Return as JSON.
  `;

  const issues = await claude.generate(prompt);

  for (const issue of issues) {
    createIssue({
      ...issue,
      linkedSpec: spec.id,
      linkedEpic: spec.epic,
    });
  }
}
```

**Impact**:
- Removes 80% of "back and forth" on scope
- Engineers get pre-scoped tasks
- Speeds up sprint planning

---

### 3. ENGINEERING FEEDBACK IN SPECS (Quality Multiplier)

**Problem**: PM writes spec. Engineer reviews entire doc. Finds issues. Asynchronous back-and-forth.

**Solution**: Inline, threaded comments during spec writing.

```markdown
# User Notifications Spec

## Overview
Real-time notifications for conversation events.

> 💬 **eng-comment** (alice@company.com, 2 hours ago):
> "WebSocket or polling? Need this before we start architecture."
>
> 🔴 Status: NEEDS_RESPONSE
>
> 💬 **reply** (pm@company.com, 1 hour ago):
> "WebSocket preferred for real-time. Added to spec."
>
> 🟢 Status: RESOLVED

## Implementation Plan

### Real-Time Transport
Use WebSocket for real-time delivery, fallback to polling.

> 💬 **eng-comment** (bob@company.com, 30 min ago):
> "What about scaling WebSocket connections? Expected concurrency?"
>
> 🟡 Status: IN_DISCUSSION
```

**Implementation**:
- New file format: Specs support comment syntax
- New Web UI: Comment panel alongside spec editor
- New API: POST `/api/specs/:id/comments`
- New Agent: Auto-notify when comment unresolved >24h

**Comment Format** (in Markdown):
```markdown
> [eng-comment | pm-comment | design-comment]
> Author: name | Date: ISO8601 | Status: OPEN|RESOLVED|NEEDS_RESPONSE|IN_DISCUSSION
>
> Comment text here
>
> [/comment]
```

**Impact**:
- Catches engineering concerns during spec writing (shift left)
- Reduces review cycles
- Creates audit trail: "why did we make this decision?"

---

### 4. SIGNAL → SPEC PIPELINE (Closes the Loop)

**Problem**: Customers request features via Gong, sales, support. These signals disappear into Slack. PMs manually create specs from memory.

**Solution**: Structured signal capture + AI spec generation.

```
Gong Call Recording
       ↓ (Agent extracts insight)
Signal Entry (.prodman/signals/)
       ↓ (PM validates)
Generate Spec
       ↓ (Engineer reviews + comments)
Approved Spec
       ↓ (Break It Down agent)
Ready-to-Build Issues
```

**Usage**:
```bash
# Option 1: Capture manually
$ prodman signal create
> Type: customer_feedback | sales_request | support_ticket | user_research
> Title: "Customers need bulk export"
> Quote: "[paste customer feedback]"
> Segment: Enterprise
> Created: .prodman/signals/sig-042-bulk-export.yaml

# Option 2: Auto-sync from Gong (future)
$ prodman sync gong
> Found 12 new calls with insights
> Extracted 3 signals from key words: "pain", "urgent", "competitor"

# Option 3: From the AI chat
$ prodman "Summarize the top 5 feature requests"
> Based on signals captured this month...

# Generate spec from signal
$ prodman spec draft --from-signal sig-042
> Creating spec from signal...
> Generated: .prodman/specs/bulk-export.md
```

**Signal Format** (.prodman/signals/):
```yaml
id: SIG-042
type: customer_feedback
source: gong | productboard | sales | support
timestamp: 2026-01-15T10:30:00Z

title: "Bulk export feature for compliance"
quote: |
  "We need to export all conversations for audit purposes.
   Our compliance team requires this by Q2."

metadata:
  customer_name: "Acme Corp"
  customer_segment: "Enterprise"
  customer_ltv: $50k/year
  request_frequency: 1  # How many customers want this?
  urgency: high
  okr_aligned: "Data governance"

generated_spec: specs/bulk-export.md  # If spec created from this
status: open | spec_created | shipped | rejected
```

**Impact**:
- Ideas don't get lost in Slack
- Can measure: "How many customers requested this? Did we ship it?"
- Prioritization by signal strength (more signals = higher priority)

---

### 5. RELEASE GATE VALIDATION (Safety Net)

**Problem**: Features ship half-done. "Oh we'll complete the docs later." Later never comes.

**Solution**: Pre-release checklist that must pass.

```bash
$ prodman release create v2.5

🔍 Scanning 8 epics targeting v2.5...

Validation Results:
✅ EP-001 User Auth (100% complete)
✅ EP-002 OAuth (100% complete)
⚠️  EP-003 Real-time Notifications (95% complete)
   - 1 open issue: #92 Design approval pending
   - Suggestion: Hold until #92 done
❌ EP-004 Analytics (60% complete)
   - 15 open issues
   - Suggestion: Remove from release

What would you like to do?
1. Remove EP-004 from release ← recommended
2. Override (allow incomplete epic)
3. Exit

Selected: 1

✅ Pre-flight checks:
  ✅ All specs approved
  ✅ All unit tests passing
  ✅ All acceptance criteria met
  ✅ Database migrations scripted
  ✅ Performance tested
  ✅ Security review completed
  ✅ Release notes prepared

🎉 Release v2.5 is ready!

Generated:
├── Release notes (for customers)
├── Internal changelog (for team)
├── Migration guide (for ops)
└── Rollback playbook
```

**Release Gate Criteria** (.prodman/release-gate.yaml):
```yaml
readiness_checks:
  spec_completeness:
    - status: approved (not draft, not review)
    - acceptance_criteria: all checked
    - no_pending_comments: true

  implementation:
    - all_issues_closed: true
    - code_reviewed: true
    - no_merge_conflicts: true

  testing:
    - unit_tests: passing
    - integration_tests: passing
    - e2e_tests: passing
    - coverage: ">80%"

  documentation:
    - api_docs: updated
    - user_guide: updated
    - changelog: has_entry

  security:
    - security_review: completed
    - no_open_issues: true
    - depends_on:
        - EP-002  # Must ship with auth first

  performance:
    - tested: true
    - p99_latency: "<200ms"
```

**Impact**:
- Prevents rushed releases
- Auto-generates release comms (saves hours)
- Audit trail: "Why did we decide to ship this?"

---

### 6. LIVING TRACE: Code ↔ Spec

**Problem**: PM writes spec. Engineer codes. No one knows which acceptance criteria are implemented where.

**Solution**: Auto-link commits to acceptance criteria.

```markdown
# User Notifications Spec

## Implementation Status

| Criterion | Code Location | Tests | Status |
|-----------|---|---|---|
| Send real-time notifications | src/notifications/sender.ts#45 | ✅ 12 tests | ✅ Done |
| Rate limit 100/min | src/middleware/rateLimit.ts#32 | ✅ 3 tests | ✅ Done |
| Support email notifications | src/notifications/email.ts | ⏳ Tests failing | 🚧 In Progress |
| User preferences UI | src/components/NotificationPrefs.tsx | — | ❌ Not Started |

## Recent Commits
- 2026-01-15 abc123: Implement notification sender (alice@company.com)
- 2026-01-14 def456: Add rate limiting (bob@company.com)
```

**How It Works**:

Engineer commits with:
```bash
git commit -m "Implement email notifications

Spec: specs/user-notifications.md
Criterion: Support email notifications
Issue: #91"
```

Agent detects on merge:
1. Parses commit message
2. Finds spec + criterion
3. Marks criterion done in spec file
4. Auto-commits spec update

**Impact**:
- PM sees progress without asking ("Is this done yet?")
- Catches spec mismatches (code doesn't match spec)
- Living documentation
- Easy onboarding

---

## Implementation Guide

### Phase 1: Spec Quality (Week 1-2)

**Files to Create**:
```
src/
  agents/
    ├── spec-validator.ts         # NEW
    └── index.ts                  # UPDATE: export new agent

.prodman/
  ├── dod-templates.yaml          # NEW
  └── config.yaml                 # UPDATE: add dod_template reference

CLI:
  new command: prodman spec validate
```

**Pseudocode** (spec-validator.ts):
```typescript
export async function validateSpec(specPath: string) {
  const spec = parseMarkdown(specPath);
  const dod = readDODTemplate(spec.type || 'default');

  const issues = [];

  // Check each DoD item
  for (const criterion of dod.items) {
    if (!checkCriterion(spec, criterion)) {
      issues.push({
        criterion,
        message: criterion.error_message,
        fix: criterion.suggested_fix,
      });
    }
  }

  if (issues.length > 0) {
    displayIssues(issues);
    throw new ValidationError("Spec does not meet DoD");
  }

  return { valid: true, spec };
}
```

---

### Phase 2: Issue Decomposition (Week 3-4)

**Files to Create**:
```
src/
  agents/
    └── break-it-down.ts          # NEW

CLI:
  new command: prodman agent run break-it-down <spec>
```

**Prompt to Claude**:
```
Parse this spec and break it into 3-7 implementation tasks.

Spec Title: {{spec.title}}
{{spec.body}}

Acceptance Criteria:
{{spec.acceptance_criteria}}

For EACH task, provide a JSON object with:
- title: string (starts with verb)
- description: string (1-2 sentences)
- acceptance_criteria: string[] (2-3 specific criteria)
- effort: "S" | "M" | "L"
- type: "backend" | "frontend" | "design" | "devops"
- depends_on: string[] (other issue IDs if any)

Return valid JSON array.
```

---

### Phase 3: Signals (Week 5-6)

**Files to Create**:
```
src/
  agents/
    └── signal-to-spec.ts         # NEW

CLI:
  new command: prodman signal create
  new command: prodman signal list
  new command: prodman spec draft --from-signal <signal-id>

Web UI:
  new page: /signals (list + create)
```

---

### Phase 4: Release Gate (Week 7-8)

**Files to Create**:
```
src/
  agents/
    ├── release-gating.ts         # NEW
    └── changelog-generator.ts    # NEW

CLI:
  new command: prodman release create <version>
  new command: prodman release validate

.prodman/
  ├── release-gate.yaml           # NEW
  └── release-notes/              # NEW (auto-generated)
```

---

## Success Criteria

### If These Gaps Are Filled:

1. **Spec Quality** ✅
   - Specs rejected by validator: 0 on second pass
   - PM→Engineer review cycles: reduced from 3 to 1
   - Spec approval time: <24 hours

2. **Issue Decomposition** ✅
   - Engineer questions about scope: 0
   - Auto-generated issues: 85%+ match manual breakdown
   - Sprint planning time: reduced by 30%

3. **Signals** ✅
   - Ideas captured: >80% of customer requests
   - Signal→Spec time: <1 day
   - Feature requests that ship: trackable

4. **Release Gate** ✅
   - Incomplete features shipped: 0
   - Release prep time: automated (saved 2-4 hours)
   - Release rollbacks: faster recovery (clear playbook)

5. **Living Trace** ✅
   - Specs that diverge from code: 0 (caught by agent)
   - "Is this feature done?" questions: answered automatically

---

## ROI Calculation

**For a team like Matt's (2 squads of 4 engineers, 1-2 PMs)**:

| Augmentation | Time Saved | Monthly | Annual |
|---|---|---|---|
| Spec Quality (fewer review rounds) | 3 hrs/spec × 12 specs/mo | 36 hrs | 432 hrs |
| Issue Decomposition (auto-created) | 2 hrs/spec | 24 hrs | 288 hrs |
| Signals (captured + prioritized) | 4 hrs/week sorting ideas | 16 hrs | 192 hrs |
| Release Gate (auto-validated) | 3 hrs/release × 4/year | 12 hrs | 144 hrs |
| **TOTAL** | | **88 hours/month** | **1,056 hours/year** |

**≈ 1 FTE saved per year (or one PM working at 10x capacity)**

---

## Conclusion

git-prodman is great at **storing** artifacts. These 6 augmentations turn it into a **workflow engine** that:

1. ✅ **Prevents rework** (spec validation)
2. ✅ **Removes busywork** (auto issue creation)
3. ✅ **Closes loops** (signal tracking)
4. ✅ **Reduces risk** (release gates)
5. ✅ **Improves visibility** (living trace)
6. ✅ **Captures feedback** (inline comments)

**This is what solves Matt's bottleneck.**
