# Linear Delivery Playbook

One ticket per distinct finding or suggestion. Each ticket covers one rule violation type, one missing doc, one pattern candidate, or one rubric candidate — and lists every affected file in its body.

**Error-severity findings always get a ticket.** They are never skipped due to curation limits, duplicate-title heuristics, or run-to-run de-duplication. The only exception is a pre-existing *open* ticket for the same `rule_id` — in that case, comment with the new occurrences instead of creating a duplicate. A cancelled ticket does NOT suppress an error: create a new ticket regardless.

## Tools

- `linear:list_issues` — check for existing or cancelled issues before creating
- `linear:create_issue` — open a ticket for a finding
- `linear:create_comment` — add context to an existing open ticket

## What produces a ticket

| Source | Ticket title shape | One ticket per |
|--------|--------------------|----------------|
| `missing_docs` | "Document the `{component}` component" | Component |
| `violations` (structural) | "Replace {raw element} with `{primitive}`" / "Fix token misuse in {area}" | rule_id |
| `violations` (`use-sentence-case`) | "Fix sentence case in dashboard copy" | rule_id |
| `violations` (`copy-typo`) | "Fix typos in dashboard copy" | rule_id |
| `violations` (`avoid-vague-cta`) | "Replace vague CTAs in dashboard" | rule_id |
| `violations` (`brand-terminology`) | "Fix brand terminology in dashboard copy" | rule_id |
| `violations` (`brand-voice`) | "Fix tone and voice in dashboard copy" | rule_id |
| `pattern_candidates` | "Document the `{proposed_name}` pattern" | Proposed pattern |
| `rubric_candidates` | "Add `{proposed_rule_id}` rule to design skill" | Proposed rule |

Violations with the same `rule_id` across multiple files → **one ticket** listing all affected files. Do not create a ticket per file.

## Preflight — Check the triage backlog

Before creating any tickets, evaluate the current Triage backlog so the audit doesn't pile another overwhelming batch on top of unresolved work.

```
linear:list_issues
  filter: { label: "design-audit", state: "Triage" }
  team: "Design"
```

- **0–9 pending in Triage:** proceed normally.
- **10 or more pending in Triage:** do **not** create new `warn`/`info` tickets, pattern candidates, or rubric candidates this run. Comment new occurrences on existing open tickets where applicable, and note in the report: "Triage backlog at {N} — deferred {M} non-error tickets until backlog drops below 10."
- **Errors are exempt:** `error`-severity findings are always filed regardless of backlog size (per the rule at the top of this doc).

## For each ticket to create

### Step 1 — Check for a duplicate or cancelled ticket

Before creating, call:

```
linear:list_issues
  filter: { label: "design-audit" }
  team: "Design"
```

- **An open ticket with the same title or same rule_id already exists** → comment on it with any new affected files. Do not create a duplicate.
- **A cancelled ticket for this same finding exists** → skip it entirely. The team already decided not to act on it. Move to the next finding.
- **No matching ticket** → create it (Step 2).

### Step 2 — Create the ticket

```
linear:create_issue
  title: {title from table above}
  team: "Design"
  project: "Design Audit"  # https://linear.app/resend/project/design-audit-59b6c51f2dee
  labels: ["design-audit"]
  state: "Triage"
  priority: {see Priority rules}
  body: {see Body format}
```

### Priority rules

| Condition | Priority |
|-----------|----------|
| `error` severity | Urgent |
| `warn` severity | Medium |
| `info` severity, pattern candidate, rubric candidate | Low |

### Body format

Plain markdown only. No HTML tags.

```markdown
{one sentence describing the problem}

**Rule:** `{rule_id}` · [Design reference]({design_ref})

**Affected files:**
- `{file}:{line}` — {suggestion}
- `{file}:{line}` — {suggestion}

**Suggestion:** {suggestion}
```

For pattern and rubric candidates:

```markdown
{rationale}

**Occurrences:**
- `{file}:{line}`
- `{file}:{line}`

**Suggested fix:** {suggested_fix}
```

## Failure handling

If any Linear MCP call fails:
1. Print the full error to the session transcript.
2. Print the list of tickets that were not created.
3. Do not retry more than once.
