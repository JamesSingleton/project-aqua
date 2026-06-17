# Report Format

## Curation rules — read before building the report

**Do not list every finding.** The goal is an actionable ticket, not an exhaustive log.

1. **Errors are always logged in full.** Every `error`-severity finding must appear in the ticket body and get its own Linear ticket — no exceptions, no count summaries. They are never folded into "N more findings".
2. **Top findings (warn/info):** After errors, pick the 5 most impactful non-error findings. Rank by: number of affected files, then `warn` before `info`. These are the only non-error findings that appear in the Linear ticket body.
3. **Counts only for the rest:** Everything outside the top 5 non-error findings is summarised as a count (e.g. "12 more warnings across token misuse and substitution").
4. **Skip info-only runs:** If all findings are `info` severity and there are fewer than 5, note "No significant violations found this week" and skip the findings section entirely.
5. **No HTML:** Do not use `<details>`, `<summary>`, or any HTML tags. Linear renders plain markdown only.

---

## JSON structure

Emit this JSON internally (not in the ticket body — use it to build the markdown):

```json
{
  "generated_at": "2026-04-20T09:00:00Z",
  "commit_sha": "<read from git rev-parse HEAD>",
  "summary": {
    "errors": 0,
    "warnings": 0,
    "info": 0,
    "coverage_pct": 0
  },
  "missing_docs": [
    { "ui_file": "src/ui/banner.tsx", "component": "banner" }
  ],
  "violations": [
    {
      "file": "src/app/(dashboard)/settings/page.tsx",
      "line": 42,
      "category": "substitution",
      "severity": "warn",
      "rule_id": "use-button-primitive",
      "suggestion": "Use <Button> from @/ui/button",
      "design_ref": "/design/components/button"
    },
    {
      "file": "src/app/(dashboard)/domains/page.tsx",
      "line": 18,
      "category": "copy",
      "severity": "warn",
      "rule_id": "use-sentence-case",
      "suggestion": "\"Add New Domain\" → \"Add new domain\"",
      "design_ref": "/design"
    },
    {
      "file": "src/app/(dashboard)/emails/page.tsx",
      "line": 73,
      "category": "copy",
      "severity": "error",
      "rule_id": "copy-typo",
      "suggestion": "\"Sucessfully sent\" → \"Successfully sent\"",
      "design_ref": ""
    }
  ],
  "pattern_candidates": [
    {
      "proposed_name": "empty-state",
      "occurrences": ["src/app/(dashboard)/emails/page.tsx:88", "src/app/(dashboard)/domains/page.tsx:34"],
      "rationale": "Icon + heading + description + CTA repeated across 3+ dashboard pages without a documented pattern."
    }
  ],
  "rubric_candidates": [
    {
      "proposed_rule_id": "tooltip-accessible-trigger",
      "occurrences": ["src/app/(dashboard)/settings/page.tsx:14", "src/app/(dashboard)/domains/page.tsx:62"],
      "rationale": "Tooltip trigger consistently lacks aria-label, but no rule currently enforces this.",
      "suggested_fix": "Require aria-label on all Tooltip.Trigger elements that wrap icon-only buttons."
    }
  ]
}
```

`coverage_pct` = `(documented_count / total_ui_components) * 100`, rounded to one decimal.

---

## Markdown template

Use this structure for the Linear ticket body. Fill in only the sections that have findings. Omit empty sections entirely.

```markdown
**{YYYY-MM-DD} · `{SHA_SHORT}` · Coverage: {COVERAGE_PCT}% ({DOCUMENTED}/{TOTAL})**

{ERRORS} errors · {WARNINGS} warnings · {INFO} info

---

{IF any error findings — always include this section, no matter how many}
### Errors ({COUNT})

{FOR EACH error finding — list every one, no truncation}
- **[{rule_id}]** `{file}:{line}` — {suggestion}

---

### Top findings

{FOR EACH OF THE TOP 5 WARN/INFO FINDINGS, one bullet per finding}
- **[{rule_id}]** `{file}:{line}` — {suggestion} → [{design_ref}]({design_ref})

{IF more warn/info findings beyond top 5}
_{N} more findings ({REMAINING_WARNINGS} warnings, {REMAINING_INFO} info) — run the audit locally to see the full list._

---

### Missing documentation ({COUNT} components)

{LIST component names, one per line, max 10. If more: "and N others."}
- `{component}` — `{ui_file}`

---

### Pattern candidates

{FOR EACH candidate}
- **`{proposed_name}`** — {rationale} ({occurrences count} occurrences)

---

### Rubric candidates

{FOR EACH candidate}
- **`{proposed_rule_id}`** — {rationale} Suggested fix: {suggested_fix}

---

_Design audit skill · [Design system](/design)_
```

**Rendering rules:**
- Use plain markdown lists and headers only — no HTML
- `file:line` references as inline code, not links (Linear doesn't resolve repo links)
- Keep the whole body under ~40 lines so it's readable without scrolling
