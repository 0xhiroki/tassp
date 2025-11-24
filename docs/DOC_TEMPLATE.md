# Task Document Template

Use this structure for planned and completed task docs to keep expectations consistent across the repo.

## Front Matter
- **Title:** `# Task: <name>` (or `# TODO:` for lightweight items)
- **Metadata:** status, last updated date, related docs/tasks, owners if relevant

## Sections
1. **Objective** – Concise description of the desired outcome and why it matters.
2. **Prerequisites / Dependencies** – Environment requirements, upstream tasks, secrets, or tooling that must exist before starting.
3. **Implementation Steps** – Ordered, actionable steps (commands, files, acceptance notes). Use sub-bullets for clarity.
4. **Validation** – Commands/tests/manual checks required before marking complete.
5. **Completion Criteria** – Checklist of measurable conditions proving the task is finished.
6. **Notes / Follow-ups (optional)** – Risks, lessons, links, or future work items discovered while working the task.

## Usage Tips
- Keep sections concise; link to PLAN.md, AGENTS.md, or other docs instead of duplicating content.
- Update “Status” and “Updated” fields whenever the task progresses.
- Move files from `docs/planned/` to `docs/completed/` once all completion criteria and validation steps pass.
