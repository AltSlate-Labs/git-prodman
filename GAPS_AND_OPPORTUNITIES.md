# Critical Gaps in git-prodman for Solving Matt's Problem

## Executive Summary

git-prodman is architecturally sound but **missing critical workflow automation layers** that would make it indispensable for teams struggling with the Product→Engineering translation bottleneck (like Matt's).

The tool excels at **storage and versioning** but lacks:
1. **Spec-readiness enforcement** — What makes a spec "build-ready"?
2. **Intelligent issue decomposition** — Breaking specs into scoped, estimatable tasks
3. **Context linking & traceability** — Connecting ideas, specs, code, and tests
4. **Release/feature readiness gates** — Pre-ship validation
5. **Signal-to-spec conversion** — Turning Gong/Productboard into structured PRDs
6. **Cross-team feedback loops** — Engineering input during spec writing

---

## Gap 1: No "Definition of Done" Engine

### The Problem
Matt said: *"Definitions of Done are inconsistent, which makes delivery feel harder than it needs to be."*

### Current State
- Specs have `status: draft|review|approved|implemented`
- Epics have `acceptance_criteria` (free-form checklist)
- **No way to enforce or validate DoD**
- No per-team or per-epic DoD templates
- No pre-commit hooks checking DoD compliance

### What's Missing
```yaml
# MISSING: .prodman/dod-templates.yaml
definitions_of_done:
  backend_feature:
    - "Spec approved (status: approved)"
    - "API endpoints documented in OpenAPI"
    - "Unit tests written (>80% coverage)"
    - "Integration tests added"
    - "Database migrations scripted"
    - "Performance tested (< 200ms p99)"
    - "Security review completed"
    - "Linked to tracking issue"

  frontend_feature:
    - "Spec approved"
    - "UI designs reviewed and linked"
    - "Accessibility audit (WCAG 2.1 AA)"
    - "Cross-browser tested"
    - "Mobile responsive tested"
    - "Unit tests written"
    - "E2E tests added"

  spec_ready_for_engineering:
    - "Title and overview clear"
    - "Acceptance criteria specific and testable"
    - "Dependencies identified and linked"
    - "Edge cases documented"
    - "Performance requirements specified"
    - "Security considerations noted"
    - "Design linked (if UI work)"
    - "Reviewed by at least 1 engineer"
```

### Why This Matters for Matt
- Engineers currently ask clarifying questions → DoD template prevents this
- "Ready to build" becomes machine-checkable
- Can auto-block specs from being pulled into Kanban if incomplete
- Each squad can have their own DoD template → consistency across teams

---

## Gap 2: No Intelligent Issue Decomposition

### The Problem
Matt said: *"Product ideas are plentiful but they're often not work-ready for engineering without a lot of back-and-forth."*

### Current State
- Can create issues manually
- Can list issues
- **No AI-assisted breaking down of specs into implementation tasks**
- No dependency detection between issues
- No estimation guidance

### What's Missing: The "Break It Down" Agent

```bash
# This should exist but doesn't:
$ prodman agent run break-it-down --spec specs/user-notifications.md

# Should output:
# .prodman/issues/open/
#   ├── 88-data-model.md       (Design notification schema)
#   ├── 89-api-endpoints.md    (Create /notifications endpoints)
#   ├── 90-push-service.md     (Integrate push provider)
#   ├── 91-ui-component.md     (Notification UI component)
#   └── 92-preferences.md      (User notification preferences)

# Each issue should have:
# - Estimated effort (small/medium/large)
# - Exact acceptance criteria from spec
# - Dependencies linked ("blocked by 88", "blocks 91")
# - Type: (backend|frontend|design|devops)
# - Suggested assignee based on commit history
```

### How This Works (Pseudocode)
```typescript
async function breakItDown(specPath: string) {
  const spec = readSpec(specPath);

  const prompt = `
  You are a technical PM breaking down a spec into engineering tasks.

  Spec: "${spec.title}"
  Overview: ${spec.body}
  Acceptance Criteria:
  ${spec.acceptanceCriteria.join('\n')}

  Break this into 3-7 implementation issues. For each issue:
  1. Title (starts with verb: "Create", "Build", "Design", "Test", "Fix")
  2. Description (1-2 sentences of what needs to be done)
  3. Acceptance Criteria (2-3 specific, testable criteria)
  4. Estimated effort (S/M/L)
  5. Dependencies (if any, by issue #)
  6. Type (backend|frontend|design|devops)

  Return as JSON array of issues.
  `;

  const issues = await ai.generate(prompt);

  // Create issue files with links back to spec
  for (const issue of issues) {
    createIssue(issue, linkedEpic: spec.epic, linkedSpec: spec.id);
  }
}
```

### Why This Matters for Matt
- Removes the "back-and-forth" between PM and engineering
- Gives engineers pre-scoped, bite-sized tasks
- Automatically orders by dependencies
- Effort estimates help with sprint planning

---

## Gap 3: No "Signal → Spec" Pipeline

### The Problem
Matt's tools feed signals into the process:
- **Gong** (call recordings with customer insights)
- **Productboard** (customer feedback)
- **Sales insights** (feature requests)

But there's **no structured way to convert these into specs**.

### Current State
- AI can answer questions about the product
- **No integration with external signal sources**
- **No standardized way to capture "why we're building this"**

### What's Missing: Signal Ingestion + Spec Generation

```bash
# This should exist:
$ prodman agent run signal-to-spec --source gong --gong-call-id 12345

# Or from Productboard:
$ prodman agent run signal-to-spec --source productboard --feature-request-id abc123

# Or manual signal logging:
$ prodman signal create "Customer asked for real-time notifications"
> Created: .prodman/signals/sig-001-realtime-notifications.md
> Want to draft a spec from this signal? [Y/n]
```

### What This Does
1. **Captures signal** (customer quote, sales request, user research, support ticket)
2. **Links signal to product context** (which customer segment? which OKR?)
3. **Auto-drafts spec** using the signal as context
4. **Maintains traceability**: Signal → Spec → Epic → Issues → Code

```yaml
# .prodman/signals/sig-001.yaml
id: SIG-001
type: customer_feedback        # customer_feedback|sales_request|support_ticket|user_research
source: gong
timestamp: 2026-01-15
customer_segment: "Enterprise"
okr_aligned: OKR-002
severity: high

title: "Customers need real-time notification updates"
quote: |
  "We're managing hundreds of conversations, need real-time alerts
   when something important happens"

attributes:
  customer_name: "Acme Corp"
  customer_segment: "Enterprise"
  customer_lifetime_value: $50k
  request_frequency: 3           # How many customers asked for this?

generated_spec: specs/user-notifications.md  # Link to generated spec
```

### Why This Matters for Matt
- **Closes the discovery loop**: Ideas don't sit in Slack/Gong/Productboard
- **Traces ROI**: You can see which customer requested a feature and track if it shipped
- **Prevents duplicate work**: If 3 customers want the same thing, you see it
- **Prioritizes by signal strength**: Features with more signal move up

---

## Gap 4: No "Ready to Ship" Validation Gate

### The Problem
Matt said: *"Support releases by making sure features are genuinely ready rather than rushed over the line."*

### Current State
- No validation that a feature is complete before release
- No checklist for "ready to ship"

### What's Missing: Pre-Release Gate Agent

```bash
$ prodman release create v2.5
> Scanning epics targeting v2.5...
> Found 8 epics. Validating readiness...

# Output:
✅ EP-001 User Auth (100% complete, all issues closed)
✅ EP-002 OAuth (100% complete)
⚠️  EP-003 Real-time Notifications (95% complete, 1 issue open: #92)
❌ EP-004 Analytics (60% complete, 15 issues open)

# Blockers:
- EP-004 is not ready. Remove from release? [Y/n]
- EP-003 has 1 blocker: #92 (Design review pending). Proceed anyway? [Y/n]

# If all green, generates:
✅ Release notes (auto-generated from merged specs)
✅ Customer comms template
✅ Internal changelog
✅ Migration docs (if needed)
```

### What This Validates
```yaml
# .prodman/release-gate.yaml
readiness_checks:
  spec_completeness:
    - status: approved
    - acceptance_criteria: complete (0% unchecked)

  testing:
    - unit_tests_passing: true
    - integration_tests_passing: true
    - e2e_tests_passing: true
    - coverage: ">80%"

  documentation:
    - api_docs_updated: true
    - user_guide_updated: true
    - changelog_entry: exists

  security:
    - security_review_completed: true
    - no_open_security_issues: true

  performance:
    - performance_tested: true
    - p99_latency: "<200ms"
```

### Why This Matters for Matt
- Prevents "rushed" releases
- Ensures every feature is actually done before it ships
- **Generates release comms automatically** (huge time savings)
- Creates an audit trail: "Why did we ship this?"

---

## Gap 5: No "Engineering Input During Spec" Workflow

### The Problem
Right now the workflow is:
1. PM writes spec
2. PM asks engineer to review
3. Engineer reads entire spec, finds issues
4. Back-to-back-to-forth

### Current State
- Specs are documents in `.prodman/specs/`
- No native way for engineers to embed feedback/concerns into the spec during writing

### What's Missing: Embedded Comments + Spec Status Workflow

```markdown
# User Notifications Spec

## Overview
Real-time notifications for conversation events.

```

> 💬 **eng-comment-1** (Alice, Jan 11):
> "Are we using WebSocket or polling? Need to know before architecture decision."
>
> Status: NEEDS_RESPONSE

## Implementation Plan

### Database Schema
```sql
CREATE TABLE notifications (
  id UUID,
  user_id UUID,
  type TEXT,
  -- ...
)
```

> 💬 **eng-comment-2** (Bob, Jan 11):
> "Should we partition by user_id? Expecting 10M notifications/day. This table will get huge."
>
> Reply (Alice, Jan 11): "Good catch. Yes, partition by user_id. Updated schema above."
>
> Status: RESOLVED

```

### Why This Matters
- **Shifts left on engineering concerns** — caught during spec writing, not implementation
- **Reduces review cycles** — feedback is inline and threaded
- **Creates audit trail** — why did we make design decisions?
- **Speeds up spec approval** — engineers sign off as they comment

---

## Gap 6: No Metrics & Impact Tracking

### The Problem
Right now there's no way to measure:
- How long does it take from idea → spec → shipped?
- Are we shipping faster than we were last quarter?
- Which features are actually creating customer value?

### Current State
- Commits are tracked in Git
- Issues have status
- **No analytics or trend tracking**

### What's Missing: Metrics Dashboard Agent

```bash
$ prodman report metrics
> Analyzing git history and .prodman/ data...

## Velocity Metrics
- Specs created this quarter: 12
- Specs approved: 10 (83%)
- Epics completed: 7
- Issues closed: 156

## Cycle Time
- Signal → Approved Spec: 3.2 days (↓ from 4.1 days last quarter)
- Spec → First Issue: 1.1 days (↑ from 0.8 days — *might be bottleneck*)
- Issue → PR: 2.3 days
- PR → Release: 0.5 days

## Feature ROI (if signals captured)
- "Real-time Notifications" (2 customer signals)
  - Customers requested: 2
  - Time to ship: 18 days
  - Status: Shipped (v2.5)
  - Estimated value: $15k MRR

## Blockers (Last 30 Days)
- Blocked issues: 8
- Average time blocked: 3.2 days
- Top blocker: "Design review pending"
```

### Why This Matters
- **Data-driven product decisions** — see what actually works
- **Identify bottlenecks** — Is it PM? Engineering? Design?
- **Measure improvement** — Did adding DoD templates help?
- **Justify headcount** — "We need another designer because design review is our bottleneck"

---

## Gap 7: No "Living Trace" Between Code and Specs

### The Problem
Right now:
- Engineer implements a feature in `src/notifications/index.ts`
- Spec is in `.prodman/specs/user-notifications.md`
- **They're not linked**

If someone asks "where is the acceptance criteria for this code?" they have to search.

### Current State
- Commits can reference issues (#42)
- **No way to link commits to specs**
- **No way to see implementation progress in the spec**

### What's Missing: Auto-Linking + Implementation Mapping

```markdown
# User Notifications Spec

## Acceptance Criteria Implementation Status

| Criterion | Code Location | Tests | Status |
|-----------|--------------|-------|--------|
| "Send real-time notifications" | `src/notifications/sender.ts:45` | ✅ 12 tests | ✅ Done |
| "Rate limit to 100/min" | `src/middleware/rateLimit.ts:32` | ✅ 3 tests | ✅ Done |
| "Support email notifications" | `src/notifications/email.ts` | ⏳ Tests failing | 🚧 In Progress |
| "User notification preferences" | — | — | ❌ Not Started |

## Commit History
- 2026-01-15 abc123 (Alice): Implement notification sender
- 2026-01-14 def456 (Bob): Add rate limiting middleware
- 2026-01-12 ghi789 (Alice): Create notification schema
```

### How to Build This
1. Engineer commits with: `git commit -m "Implement email notifications

Spec: specs/user-notifications.md
Criterion: Support email notifications
Issue: #91"`

2. On merge, agent scans commits and updates spec with implementation mapping

### Why This Matters
- **Instant visibility**: PM sees implementation progress without asking
- **Spec validation**: If code doesn't match spec, it's caught early
- **Living documentation**: Spec always reflects reality
- **Easy onboarding**: New engineers can see "here's the spec, here's the code"

---

## Gap 8: No Rollback/Revert Safety Mechanism

### The Problem
What if a feature is shipped and breaks production? Or a spec is merged but it's wrong?

### Current State
- Git history exists, but no easy way to revert a feature by spec/epic
- No "feature flag" thinking in the spec layer

### What's Missing: Feature Flags + Rollback Support

```yaml
# .prodman/epics/user-notifications.yaml
id: EP-003
title: "User Notifications"
feature_flag: "feature.notifications.v1"
dependencies:
  - EP-001
rollback_plan: |
  If in-app notifications cause issues:
  1. Disable feature flag: feature.notifications.v1=false
  2. Disable notification push service in config
  3. Revert commits: git revert abc123..def456
  4. Rollback database migration: migration-001-down.sql

  Expected rollback time: 5 minutes
  Customer impact: None (graceful degradation)
```

### Why This Matters
- **Risky features can ship confidently** (rolled back at feature flag)
- **PMs understand blast radius** before shipping
- **Faster incident response** — clear steps to revert

---

## Gap 9: No Cross-Repo Dependency Management

### The Problem (Future-Facing)
If you have multiple repos (`acme-api`, `acme-web`, `acme-mobile`):
- Epic in `acme-web` depends on Epic in `acme-api`
- **How do you know if your dependency is ready?**

### Current State
- Single-repo focus
- **No portfolio view**
- **No cross-repo dependency tracking**

### What's Missing
```bash
$ prodman portfolio add ~/projects/acme-api
$ prodman portfolio add ~/projects/acme-web
$ prodman portfolio add ~/projects/acme-mobile

$ prodman portfolio status
# Shows: acme-web EP-002 depends on acme-api EP-001
# Shows progress: acme-api EP-001 is 60% done, blocking acme-web
```

---

## Gap 10: No Native Integration with Existing Tools

### The Problem
Matt uses:
- **Gong** (call recordings)
- **Productboard** (customer feedback)
- **Jira** (where features are tracked)
- **Slack** (communication)

### Current State
- AI can answer questions about `.prodman/`
- **No native integrations**
- No way to push decisions back to Jira, Slack, etc.

### What's Missing: Integration Agents

```yaml
# .prodman/integrations.yaml
jira:
  enabled: true
  project_key: PROD
  sync_direction: bidirectional
  # When epic is created, create Jira issue
  # When Jira issue is closed, mark epic complete

slack:
  enabled: true
  webhook: https://hooks.slack.com/...
  events:
    - spec_approved: "Spec approved! Check #prod-updates"
    - epic_completed: "Epic shipped! 🎉"
    - blocker_detected: "⚠️ Blocker detected in {{ epic_title }}"

productboard:
  enabled: true
  api_key: ${PRODUCTBOARD_API_KEY}
  # Pull customer feedback as signals
  # Link shipped features back to customer requests

gong:
  enabled: true
  api_key: ${GONG_API_KEY}
  # Sync call insights as signals
```

---

## Implementation Priority Matrix

### High Impact + Low Effort (Do First)
1. **DoD Templates** — Enforce spec quality upfront
2. **Break It Down Agent** — Auto-generate implementation issues
3. **Engineering Comments in Specs** — Shift left on feedback
4. **Metrics Dashboard** — Show progress, identify bottlenecks

### High Impact + Medium Effort
5. **Signal → Spec Pipeline** — Connect Gong/Productboard to specs
6. **Living Trace** — Link code to specs automatically
7. **Release Gate** — Pre-ship validation

### Medium Impact + Low Effort
8. **Feature Flags in Specs** — Rollback safety
9. **Jira Integration** — Push decisions to tracking tool
10. **Slack Notifications** — Keep team in the loop

### Future / Nice-to-Have
11. **Cross-Repo Dependencies** — Multi-repo portfolio view
12. **Analytics** — Long-term velocity tracking

---

## Recommended MVP Enhancement Roadmap

### Phase 1 (Week 1-2): Spec Quality
- [x] DoD Templates system
- [x] Spec validation against DoD
- [x] Engineering comments in specs (threaded feedback)
- [x] `prodman validate spec` command

**Impact**: Eliminates "spec bounces" — specs are right the first time

### Phase 2 (Week 3-4): Issue Decomposition
- [x] Break It Down agent
- [x] Auto-generate issues from specs
- [x] Issue dependency detection
- [x] Effort estimation (S/M/L)

**Impact**: Removes engineering back-and-forth on scope

### Phase 3 (Week 5-6): Signal Integration
- [x] Signal capture (.prodman/signals/)
- [x] Signal → Spec generation
- [x] Link signals to customer data
- [x] Metrics dashboard

**Impact**: Closes the discovery loop, shows ROI

### Phase 4 (Week 7-8): Release Safety
- [x] Release gate validation
- [x] Auto-generated release notes
- [x] Feature flag integration
- [x] Rollback playbooks

**Impact**: Confident shipping, faster rollbacks

### Phase 5 (Ongoing): Integrations
- [ ] Jira sync
- [ ] Slack notifications
- [ ] Productboard integration
- [ ] Gong integration

---

## Conclusion

**git-prodman is 40% of the solution.** It nails:
- ✅ Git-native storage
- ✅ Versioning
- ✅ AI integration
- ✅ Async collaboration

**It's missing 60%** that would make it *indispensable* for teams like Matt's:
- ❌ Spec quality enforcement (DoD)
- ❌ Automated issue decomposition
- ❌ Signal→Spec pipeline
- ❌ Release validation gates
- ❌ Engineering feedback during spec writing
- ❌ Code-to-spec linking

**With these additions, git-prodman could solve the exact problem Matt described:**
> *"The translation from insight → problem → ticket is too dependent on a small number of people."*

By automating the translation and enforcing quality gates, you move from **tribal knowledge** to **reproducible process**.
