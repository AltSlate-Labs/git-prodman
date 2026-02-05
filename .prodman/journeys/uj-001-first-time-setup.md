---
id: UJ-001
title: "First-time project setup"
persona: "open-source-maintainer"
goal: "Initialize prodman in an existing repository"
status: draft
priority: p1
steps:
  - order: 1
    action: "Install prodman via npm"
    touchpoint: cli
    emotion: neutral
    pain_points: []
    opportunities: []
  - order: 2
    action: "Run prodman init in project root"
    touchpoint: cli
    emotion: satisfied
    pain_points: []
    opportunities:
      - "Could auto-detect project type"
  - order: 3
    action: "Review generated files"
    touchpoint: cli
    emotion: delighted
    pain_points: []
    opportunities: []
epics:
  - EP-001
related_journeys: []
author: null
created_at: 2026-02-05
updated_at: 2026-02-05
---

# First-time project setup

## Overview

This journey captures the experience of an open source maintainer setting up prodman for the first time in their existing project.

## Persona

**Target User:** Open Source Maintainer

**Goal:** Initialize prodman in an existing repository and start managing product artifacts

## Notes

This is a critical onboarding journey - first impressions matter.

## Related Epics

- EP-001: CLI Foundation
