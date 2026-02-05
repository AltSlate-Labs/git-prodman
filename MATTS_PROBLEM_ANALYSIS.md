# How git-prodman (+ Augmentations) Solves Matt's Problem

## Matt's Original Post

> *"We're a B2B SaaS business in the contact centre, QA and conversation intelligence space. The product is in a good place and shipping regularly but with AI making our engineering team 10x faster - we're falling behind within Product."*

> *"Product ideas and signals are plentiful (Gong, customer feedback, sales insight), but they're often not work-ready for engineering without a lot of back-and-forth."*

> *"Definitions of Done are inconsistent, which makes delivery feel harder than it needs to be."*

> *"Discovery happens, but the translation from insight → problem → ticket is too dependent on a small number of people."*

---

## The Real Problem Beneath the Problem

Matt's issue isn't really about **tools**. It's about **process becoming a person**.

```
Current State:
Signal → [Product Manager Brain] → Epic → [Back & Forth] → Issue → Code
                     ↑
              Tribal knowledge

Matt needs:
Signal → [Reproducible Process] → Epic → [Automatic] → Issue → Code
                        ↑
                   Enforceable,
                   teachable,
                   scalable
```

**The bottleneck**: Translation from "messy problem" to "build-ready work" depends on specific people knowing:
- What makes a spec "good"
- How to break specs into tasks
- Which tasks are missing
- What questions to ask engineers early

When that person is on vacation or leaves, everything breaks.

---

## How git-prodman (Current) Helps

### ✅ Centralizes Artifacts
- All specs, epics, decisions in one place (`.prodman/`)
- Version-controlled (audit trail)
- Searchable
- Works offline

### ✅ Lives with Code
- Engineers clone repo → they see the roadmap
- Specs live next to implementation
- PRs can reference specs in commit messages

### ✅ Git as Database
- No sync drift (Jira spec ≠ Notion spec ≠ Slack message)
- Collaboration via Git (branches, PRs, review)
- Version history for free

---

## But Current git-prodman Doesn't Solve:

### ❌ "Often not work-ready without back-and-forth"
- **Why**: No validation that spec is complete
- **Current**: Spec is just a markdown file, anyone can ship garbage
- **Need**: `prodman spec validate` that checks DoD before marking ready

### ❌ "Definitions of Done are inconsistent"
- **Why**: Each person has their own mental definition
- **Current**: Specs have free-form `acceptance_criteria`
- **Need**: `.prodman/dod-templates.yaml` with enforceable checklists per work type

### ❌ "Translation is too dependent on specific people"
- **Why**: Only certain people know how to break specs into tasks
- **Current**: Manual issue creation
- **Need**: `prodman agent run break-it-down` that auto-generates issues

### ❌ "Signals are plentiful but scattered"
- **Why**: Gong insights, Productboard feedback, sales notes → no central place
- **Current**: No signal capture in `.prodman/`
- **Need**: `.prodman/signals/` + Signal→Spec agent

### ❌ "Back-and-forth with engineers"
- **Why**: Spec written, engineer reads, finds issues, asks questions
- **Current**: Async feedback cycle
- **Need**: Inline comments in specs, caught during writing not after

---

## The Augmentation Strategy

### Gap 1: "Spec is often not work-ready"
**Matt's words**: *"They're often not work-ready for engineering without a lot of back-and-forth"*

**Current git-prodman**:
```
Spec created → Marked as "approved" → Sent to engineering
```

**With augmentation**:
```
Spec created
  ↓ (runs automatically on sync)
Spec Validator
  - Checks: clarity, specificity, completeness
  - If invalid: ❌ blocks sync, shows what's missing
  - If valid: ✅ marked "review-ready", 1 engineer review needed
  ↓
Engineer Reviews + Comments
  - Uses inline comment system (not separate email thread)
  - Clear resolution workflow
  ↓
Spec Approved ← Now actually ready
```

**Result**: Spec quality goes from ??? to provably solid. No more "wait, let me re-read this" cycles.

---

### Gap 2: "Inconsistent Definitions of Done"
**Matt's words**: *"Definitions of Done are inconsistent, which makes delivery feel harder than it needs to be."*

**Current git-prodman**:
```
Each epic has:
  acceptance_criteria:
    - "[ ] User can login"
    - "[ ] Password reset works"
    # ???
```

**With augmentation**:
```
Project has: .prodman/dod-templates.yaml

[backend feature template]
acceptance_criteria:
  - Implementation complete
  - Unit tests: >80% coverage
  - Integration tests passing
  - Database migration scripted
  - Performance tested (p99 < 200ms)
  - Security review completed
  - API docs updated
  - No open tech debt

[frontend feature template]
acceptance_criteria:
  - Implementation complete
  - Unit tests: >80% coverage
  - E2E tests passing
  - Mobile responsive
  - Accessibility audit (WCAG 2.1)
  - Browser cross-tested
  - Design review approved
  - No open tech debt

When spec is created:
  If work_type == "backend":
    Use backend template
  If work_type == "frontend":
    Use frontend template
  # Now all backend features have SAME definition of done
```

**Result**: DoD stops being a mystery. All backend specs have same checklist. All frontend specs have same checklist. Teams know exactly what "done" looks like.

---

### Gap 3: "Translation depends on specific people"
**Matt's words**: *"Discovery happens, but the translation from insight → problem → ticket is too dependent on a small number of people."*

**Current git-prodman**:
```
Spec written
  ↓
Product Manager thinks: "OK, this needs..."
  - Database schema
  - API endpoints
  - Frontend component
  - Tests
  (only good PMs think of all this)
  ↓
Creates 5 issues manually
  ↓
Engineers ask questions about scope/dependencies
  ↓
Back and forth
```

**With augmentation**:
```
Spec written
  ↓
$ prodman agent run break-it-down specs/feature.md
  (AI reads spec, extracts tasks, detects dependencies, estimates)
  ↓
Outputs:
  - Issue #88: "Design data model" (S, backend, no deps)
  - Issue #89: "Create API endpoints" (M, backend, depends on #88)
  - Issue #90: "Build UI component" (M, frontend, depends on #89)
  - Issue #91: "Add tests" (M, QA, depends on #88,#89,#90)
  - Issue #92: "Docs + release notes" (S, ops, depends on #91)
  ↓
All linked back to parent spec
All with extracted acceptance criteria
All with dependencies computed
All with effort estimates
  ↓
Engineers: "Oh, these are already scoped. Let me just start #88."
No questions. No back and forth.
```

**Result**: Issue creation becomes reproducible. Any PM can run the agent. New PMs don't need to "learn" from senior PM. Process is codified, not tribal.

---

### Gap 4: "Signals are plentiful but scattered"
**Matt's words**: *"Product ideas and signals are plentiful (Gong, customer feedback, sales insight)"*

**Current git-prodman**:
```
Gong call → Slack message: "Customer wants feature X"
Productboard → Buried in web UI
Sales intel → Email thread nobody looks at
  ↓
Gets lost, maybe PM remembers later
  ↓
Could be duplicated work (feature requested 3 times but team doesn't know)
```

**With augmentation**:
```
When customer signal appears:
$ prodman signal create
> Type: customer_feedback | sales_request | support_ticket
> Customer: "Acme Corp"
> Quote: "We need to export notifications for compliance"
> Segment: Enterprise
> Created: .prodman/signals/sig-042.yaml

Stored in Git, visible to whole team

If multiple signals cluster:
$ prodman metrics | grep "most requested features"
  - "Bulk export" (3 customer signals, 2 sales requests)
  - "Real-time sync" (2 customer signals, 1 support ticket)
  ↓
These rise to top of roadmap automatically
  ↓
When feature ships:
  Signal status updates: shipped ✅
  Team can measure: "We got 3 requests, we built it, it's live"
  Customer success can report: "Your feature request is live!"
```

**Result**: Ideas don't vanish. Prioritization becomes data-driven. ROI is traceable.

---

### Gap 5: "Back-and-forth with engineering"
**Matt's words**: *"They're often not work-ready for engineering without a lot of back-and-forth"*

**Current git-prodman**:
```
PM writes spec
Email: "Please review"
Engineer reads, finds 3 ambiguities
Email back: "Questions on these lines..."
PM responds via email (now in 4 different systems)
```

**With augmentation**:
```
PM writes spec
Engineer opens in web UI
Engineer sees fuzzy language: "user-friendly"
Engineer can:
  1. Hover over text
  2. Click "comment"
  3. Type: "What's the performance requirement here?"
  4. Status: NEEDS_RESPONSE (auto-notifies PM)

PM sees comment
PM responds inline: "p99 < 200ms"
Engineer marks: RESOLVED
Status: ✅ All comments resolved → Ready for approval

Result: Async, threaded, searchable, one source of truth
```

**Result**: Feedback is caught during spec writing (shift left), not after implementation starts. Reduces rework dramatically.

---

## The Complete Solution

```
Before git-prodman:
─────────────────
Gong calls + Productboard + Sales intel
  → (scattered in 5 different tools)
  → Slack conversations
  → Someone's brain
  → Jira epic
  → 1 PM breaks into tasks
  → Jira issues
  → Engineering questions
  → Slack threads
  → 3-week delay to clarity
  → Code


After git-prodman (current):
──────────────────
All artifacts in `.prodman/` in Git
  → Versioned
  → Searchable
  → Audit trail
  BUT still manual, still dependent on people


After git-prodman (with augmentations):
───────────────────────────
Signal captured in .prodman/signals
  ↓ (Signal→Spec agent)
Spec auto-drafted from customer insight
  ↓ (Spec Validator)
Spec validated against DoD template
  ↓ (Engineer inline comments)
Engineer feedback caught during writing
  ↓ (Break It Down agent)
Issues auto-generated with dependencies
  ↓ (Engineering starts work)
Code references spec via commits
  ↓ (Living Trace agent)
Spec auto-updated with implementation status
  ↓ (Release Gate agent)
Feature validated before ship
  ↓ (Changelog Generator)
Release notes auto-generated
  ↓
Feature ships, signal marked ✅, ROI visible
```

---

## Measurement: How to Know It Works

### Metrics That Prove the Solution Works

1. **Spec Quality**
   - Before: "We need PM review + engineering review to catch issues" (2 reviews)
   - After: "Spec validator catches issues, 1 engineering review enough" (1 review)
   - Measurement: Review cycles reduced from 3 to 1.5

2. **Issue Creation**
   - Before: PM manually creates 5 issues per spec (2 hours of thinking)
   - After: Agent auto-creates issues (5 minutes) + PM review
   - Measurement: Issue creation time reduced by 75%

3. **Back & Forth**
   - Before: Engineer has questions → email → wait for response → questions answered in 1-2 days
   - After: Engineer comments inline → auto-notified → feedback during spec writing
   - Measurement: "How long from spec creation to engineering start work?" (before: 5 days, after: 1 day)

4. **Signal Capture**
   - Before: "Customer wanted feature X" is forgotten in 3 weeks
   - After: Signal captured, trackable, can measure if shipped
   - Measurement: % of customer requests that result in shipped features

5. **Release Quality**
   - Before: "Oops, we shipped that half-done"
   - After: Release gate blocks incomplete features
   - Measurement: 0 incomplete features shipped per quarter

6. **Team Dependency**
   - Before: "Only Alice knows how to write good specs"
   - After: "Anyone can run the agents, process is codified"
   - Measurement: # of people who can write specs went from 1 to N

---

## Why This Specifically Solves Matt's Problem

| Matt's Challenge | Root Cause | git-prodman (current) | With Augmentations | Result |
|---|---|---|---|---|
| "Ideas not work-ready without back-and-forth" | No spec validation | ❌ No checks | ✅ Spec Validator | Specs are born ready, not iteratively fixed |
| "Inconsistent DoD" | DoD is tribal knowledge | ❌ No templates | ✅ DoD Templates | Consistent definition, machine-checked |
| "Translation dependent on people" | Manual issue creation | ❌ Manual process | ✅ Break It Down agent | Reproducible, anyone can do it |
| "Signals scattered in Gong/Productboard" | No centralized signal store | ❌ No signal layer | ✅ Signal capture + agent | Signals tracked, prioritized, shipped |
| "Back & forth before building" | Async feedback cycle | ❌ Async (emails) | ✅ Inline comments | Feedback caught early, async but structured |
| "Falling behind engineering" | PM process is manual | ❌ Tooling helps store | ✅ Workflow automated | PM productivity matches engineering 10x boost |

---

## Why git-prodman Is the Right Platform

### Option A: Use Jira + Linear + Notion + Slack (Current State)
- ❌ Fragmented data
- ❌ Specs drift from reality
- ❌ No version history
- ❌ Decisions lost in chat

### Option B: Keep using disconnected tools but hire more PMs
- ❌ Expensive
- ❌ Scales poorly
- ❌ Doesn't solve the tribal knowledge problem
- ❌ Still disconnected

### Option C: Use git-prodman (+ augmentations)
- ✅ Single source of truth (Git)
- ✅ Specs live with code
- ✅ Agents automate the tedious parts
- ✅ Process codified, not tribal
- ✅ Scales: 1 PM can do what 3 PMs used to do
- ✅ AI-native (Claude integration)
- ✅ Open source (no vendor lock-in)
- ✅ Free (MIT license)

**This is the platform that lets Matt's team of 1-2 PMs compete with teams of 5+ PMs.**

---

## Implementation for Matt (90-day roadmap)

### Week 1-2: Spec Quality
- [ ] Define DoD templates for backend, frontend, design
- [ ] Implement spec validator
- [ ] Test on existing specs
- **Win**: Next spec created will be validated automatically

### Week 3-4: Issue Decomposition
- [ ] Implement Break It Down agent
- [ ] Test on 5 existing specs
- [ ] Train team on workflow
- **Win**: Specs now auto-generate tasks, no more manual issue creation

### Week 5-6: Signal Capture
- [ ] Create signal schema (customer feedback, sales requests, support tickets)
- [ ] Capture all ideas from last 3 months
- [ ] Build Signal→Spec agent
- **Win**: Prioritization is now data-driven, customer requests are tracked

### Week 7-8: Release Gate
- [ ] Define release-gate criteria
- [ ] Implement validation
- [ ] Auto-generate release notes
- **Win**: Features don't ship half-done, release prep is automated

### Result
- Engineering team stays 10x faster (AI helps them)
- Product team keeps pace (AI helps them)
- Spec quality up
- Rework down
- Team productivity up
- PM tribal knowledge → codified process

---

## The Bottom Line

> **git-prodman (current)** is a great **storage layer**.

> **git-prodman (+ augmentations)** becomes a **workflow engine** that solves Matt's exact problem.

The augmentations turn from:
- **Manual, tribal, person-dependent** product process
- To: **Automated, reproducible, team-scalable** product process

Matt's bottleneck isn't really product. It's that product tools haven't kept up with how fast engineering has gotten. This fixes that.
