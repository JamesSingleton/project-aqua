---
name: resend-design-skills
description: Use when needing Resend design resources. Routes to brand guidelines and visual identity.
metadata:
  author: resend
  version: "2.0.0"
---

# Design Skills

A collection of design-related skills for Claude Code.

## Available Skills

| Skill | Use for | Path |
|-------|---------|------|
| `resend-brand` | Brand colors, typography, logos, and visual identity — marketing materials, social graphics, presentations, and any external-facing content | `resend-brand/SKILL.md` |

## Structure

Each skill is a folder with a `SKILL.md` (frontmatter + guidelines) and optional `references/`.

```
design-skills/
├── SKILL.md              # This index file
├── resend-brand/
│   └── SKILL.md          # Resend brand skill
└── tests/
    └── TESTS.md          # Combined test suite
```
