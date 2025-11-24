# Task: Upgrade Node Runtime

**Status:** Completed  
**Updated:** 2025-11-23  
**Target Version:** ≥20.19.4 (Expo RN 0.81.5, Next.js 16, Prisma 7)

## Objective
Standardize the repository on Node 20.19.x so contributors run Expo, Next.js, and Prisma tooling without compatibility warnings.

## Implementation Summary
1. Added a root `.nvmrc` pinned to `20.19.0` so `nvm use`/`fnm use` automatically select a compliant runtime.
2. Updated `AGENTS.md` and `README.md` to call out the Node 20.19.x requirement and reference `.nvmrc`.
3. Re-installed frontend/back-end dependencies (during recent upgrades) under the newer toolchain and ensured lint/tests pass.

## Validation
- `node -v` (after `nvm use`) should report `v20.19.x`.
- `cd frontend && npm run lint`
- `cd backend && npm run lint`
- `cd backend && npm run test`

## Completion Criteria
- Version pin committed (`.nvmrc`) and documented. ✅
- Contributors instructed to use Node 20 before installs. ✅
- Lint/tests succeed under the pinned runtime. ✅

## Notes / Follow-ups
- If using `asdf`/`volta`, mirror the version pin via `.tool-versions` or `package.json` engines as needed.
- When Prisma migrations run against a live DB, ensure the environment matches Node 20.19.x to avoid binary mismatches.
