# Repository Guidelines

## Project Structure & Module Organization
This Next.js app uses the App Router. Core UI lives in `src/app` (routes, layouts, server components). Shared building blocks sit in `src/components`, with stateful logic in `src/hooks` and `src/contexts`. Domain utilities (API clients, parsers, React Query helpers) live under `src/lib` and `src/data`. Type declarations belong in `src/types`. Static assets go in `public/`, while long-form docs and playbooks sit in `docs/`. Deployment scripts remain in the repo root (`deploy.sh`, `cloudbuild.yaml`).

## Build, Test, and Development Commands
Run `npm install` to sync dependencies. Use `npm run dev` for the standard Next dev server, or `npm run dev:turbo` to trial Turbopack. `npm run build` performs the production build, and `npm run start` serves the compiled output. Execute `npm run lint` before every PR; it runs the Next.js ESLint config and fails on lint or type errors.

## Coding Style & Naming Conventions
Stick to TypeScript with strict typing; add interfaces to `src/types` when reused. Components and hooks follow `PascalCase` and `useCamelCase` naming respectively; files in `src/app` mirror route paths (e.g., `analysis/page.tsx`). Use Tailwind utility classes and avoid inline `style` whenever possible. Format imports logically, grouping React/Next first and local modules last.

## Testing Guidelines
There is no automated test harness yet. When you add features, pair `npm run dev` with manual smoke checks across critical flows (document upload, chat, dashboard). If you introduce tests, align on the framework in advance (Playwright for E2E or Vitest/Jest for unit) and store specs beside the feature (`src/app/.../__tests__`). Document coverage expectations in the PR.

## Commit & Pull Request Guidelines
Commits generally follow Conventional Commit prefixes (`feat:`, `fix:`, `chore:`). Use the imperative mood and keep messages under 72 characters. For PRs, include a purpose summary, linked issue or ticket, setup notes, and screenshots or GIFs for UI changes. Ensure CI linting passes before requesting review and assign reviewers who own the touched area.

## Environment & Security Notes
Secrets belong in `.env.local`; never commit tokens. Review `next.config.ts` before enabling new domains or headers. Uploads saved under `uploads/` are developer-only; clear sensitive artifacts before pushing.
