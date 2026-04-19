# Agent Builder UI — MVP Design

**Date:** 2026-04-19
**Status:** Approved for implementation planning
**Scope:** Ship what today's backend actually supports. No speculative UI.

## 1. Context

A new backend service `agent_builder_v1` runs locally on `http://127.0.0.1:8010`. It exposes CRUD for agent definitions, versioned publishing, dry-run and real runs, and a small template catalog. We need a UI in the existing Next.js frontend (`document_intelligence_fe_v2`) that lets users create, preview, publish, and run agents — surfaced as a first-class section in the app alongside Documents, Insights, and Usage.

## 2. Backend reality (as of today)

What the backend actually does:

- **Templates** are hardcoded in `src/agent_builder/templates/catalog.py` as ordered node-type lists (linear pipelines). Current set: `summarize_documents`, `document_qa`, `extract_structured_data`. `GET /api/v1/templates/` returns `{"items": [<template_id>, ...]}` — keys only, no descriptions.
- **Node catalog** is fixed: control nodes (`trigger`, `respond`, `end`) and tool nodes (`doc.search`, `doc.read`, `doc.extract`, `summarize`, `validate`). Tool executors are echo stubs today — no real LLM invocation.
- **`DefinitionCompiler`** reads only `draft_payload["goal"]["agent_type"]` and calls `build_linear_graph` to produce a `GraphSpec` with empty per-node `config={}`. No custom node configuration, no branching, no multi-agent graphs.
- **Runs** are synchronous. `POST /api/v1/runs/{agent_id}` requires a published version, runs the graph, and returns the completed `AgentRunRead`. `GET /api/v1/runs/` lists **all** runs for the org; no per-agent filter exists.
- **Auth**: the service only requires an `X-Organization-ID` header. No JWT verification. The frontend injects the org ID from `useAuth()`.

The design below respects these constraints. We do not scaffold UI for things the backend ignores.

## 3. Scope

### In scope

- List / create / rename / delete agents
- Pick a template when creating an agent (sets `draft_payload.goal.agent_type`)
- View agent detail with metadata, graph preview, and runs
- Publish an agent (creates an immutable `AgentVersion` with a compiled `GraphSpec`)
- Dry-run an agent from its draft with a JSON input payload
- Create real runs against the latest published version
- Browse runs for an agent (client-side filter) and view run input/output
- Dashboard entry + sidebar navigation
- Environment config + startup script updates

### Out of scope (explicit non-goals)

- Visual drag-and-drop graph editor
- Per-node configuration panels (backend ignores per-node config)
- Branching / conditional / multi-agent graph authoring
- Real-time run streaming, progress indicators, or cancellation
- JWT integration with the agent builder backend
- Writing backend changes (template descriptions, node-types endpoint, etc.)

## 4. Navigation & routes

New top-level section mirroring `/documents`.

| Route | Purpose |
|---|---|
| `/agents` | List all org agents (table: name, mode, status, updated_at, actions) |
| `/agents/new` | Create-agent wizard: basics → mode → template pick |
| `/agents/[agentId]` | Agent detail with three tabs (Overview, Graph, Runs) |
| `/agents/[agentId]/test` | Dry-run playground (JSON input → output + graph) |

**Sidebar:** add an **Agents** entry (`BoltIcon`) between Documents and Insights in `AppLayout`.

**Dashboard:** add an **Agents** stat card (count of agents) linking to `/agents`, and a **Create Agent** quick action button in the existing Quick Actions card.

## 5. Pages

### `/agents` — list

- Table with columns: Name, Mode (`chat` | `workflow` | `hybrid`), Status (`draft` | `published`), Updated, Actions (open, delete).
- Top-right: **New Agent** button → `/agents/new`.
- Empty state: illustration + **New Agent** CTA.

### `/agents/new` — wizard

Three-step form (single page with stepper):

1. **Basics** — name, description
2. **Mode** — radio: chat / workflow / hybrid
3. **Template** — cards showing each template id with a hand-written description (from `src/lib/agents/template-copy.ts`) and the ordered node chips

Submit posts:
```json
{
  "name": "...",
  "description": "...",
  "mode": "workflow",
  "draft_payload": { "goal": { "agent_type": "summarize_documents" } }
}
```
On success, redirect to `/agents/[newId]`.

### `/agents/[agentId]` — detail

Header: agent name, mode badge, status badge, and action buttons:
- **Test (Dry Run)** — link to `/agents/[agentId]/test`
- **Publish** — inline popover with optional `publish_notes` textarea → `POST /publish`
- **Run** — visible only when status is `published`. Opens a JSON input modal → `POST /runs/{agentId}` → on success, switches to the Runs tab with the new run selected.

Three tabs:

- **Overview** — metadata (id, mode, template, created/updated), selected template card, latest-version summary, **Publish** CTA with optional publish-notes textarea.
- **Graph** — read-only graph preview. For an unpublished agent, we compile on demand via `POST /agents/{id}/dry-run` with an empty input and render the returned `DryRunResult.graph_spec`. For a published agent, we use the latest version's `graph_spec` directly. Cached with React Query. Shows a placeholder if compilation fails.
- **Runs** — table of runs for this agent. Fetched via `GET /runs/` then filtered client-side: we look up the agent's versions (`GET /agents/{id}/versions`), collect their IDs, and keep only runs whose `agent_version_id` is in that set. Row click opens a run detail drawer (no deep-link route for MVP) with JSON viewers for input/output.

### `/agents/[agentId]/test` — dry-run playground

Two-column layout:
- Left: Monaco-free JSON textarea (with `<textarea>` + basic validate-on-blur) labeled "Input payload". Default value `{"query": "hello"}`. **Run** button calls `POST /agents/{id}/dry-run`.
- Right: output JSON viewer + small graph preview showing which nodes executed (from `DryRunResult.graph_spec`).

Real runs are triggered from the agent detail header (**Run**) only when status is `published`. Same JSON input modal → `POST /runs/{agentId}` → redirect to the new run in the Runs tab.

## 6. Components

All new components under `src/components/agents/`:

| Component | Responsibility |
|---|---|
| `AgentList.tsx` | Table + empty state |
| `AgentCreateWizard.tsx` | Three-step create form |
| `AgentDetailHeader.tsx` | Name, badges, action buttons |
| `AgentDetailTabs.tsx` | Overview / Graph / Runs tab shell |
| `AgentOverviewPanel.tsx` | Metadata + publish form |
| `GraphPreview.tsx` | `@xyflow/react` wrapper; left-to-right layout; read-only; node chip shows `node_type` |
| `DryRunPanel.tsx` | JSON input + output viewer + graph |
| `RunsList.tsx` | Per-agent runs table (client-filtered) |
| `RunDetail.tsx` | Drawer with input/output JSON |
| `JsonViewer.tsx` | Shared pretty-print viewer with copy button |
| `JsonEditor.tsx` | Shared textarea-based JSON editor with validate-on-blur |

Template copy lives in `src/lib/agents/template-copy.ts` as a map from template id → `{ title, description, useCase }`.

## 7. API layer

Introduce a third backend client alongside `base.ts` and `ai-base.ts`.

**New files:**

- `src/lib/api/agent-base.ts` — Axios client built via `client-factory.ts`, pointed at `AGENT_API_URL`. Request interceptor injects `X-Organization-ID` from the current auth user. No JWT Bearer needed for this backend today.
- `src/lib/api/agents/index.ts` — barrel
- `src/lib/api/agents/templates.ts` — `listTemplates()`
- `src/lib/api/agents/agents.ts` — `listAgents`, `getAgent`, `createAgent`, `updateAgent`, `deleteAgent`, `publishAgent`, `listVersions`, `dryRunAgent`
- `src/lib/api/agents/runs.ts` — `createRun`, `listRuns`, `getRun`

**Config changes:**

- `src/lib/config.ts` gains `AGENT_API_URL` with the same client/server split as the existing two.
- `src/lib/constants.ts` — add `AGENT_API_TIMEOUT` (default 60s, since runs are synchronous).
- `.env.example`, `.env.local`, `.env.local-gcp` add `NEXT_PUBLIC_AGENT_API_URL=http://127.0.0.1:8010`.

**Types:**

- `src/types/agents.ts` — hand-written interfaces matching the backend schemas: `AgentMode`, `AgentStatus`, `AgentDefinition`, `AgentVersion`, `AgentRun`, `GraphNode`, `GraphEdge`, `GraphSpec`, `DryRunResult`, `AgentTemplate`.
- Backend uses snake_case; API layer converts to camelCase using the existing pattern from `ai-base.ts`.

## 8. React Query hooks

Under `src/hooks/agents/`, one file per concern:

| Hook | Signature | Notes |
|---|---|---|
| `useTemplates` | `() => UseQueryResult<string[]>` | Stale time 1h |
| `useAgents` | `() => UseQueryResult<AgentDefinition[]>` | Invalidated by mutations |
| `useAgent` | `(id) => UseQueryResult<AgentDefinition>` | |
| `useCreateAgent` | `useMutation` | Invalidates `agents` |
| `useUpdateAgent` | `useMutation` | Invalidates `agents`, `agent` |
| `useDeleteAgent` | `useMutation` | Invalidates `agents` |
| `usePublishAgent` | `useMutation` | Invalidates `agent`, `versions` |
| `useAgentVersions` | `(id)` | |
| `useDryRun` | `useMutation<DryRunResult>` | Not cached; fresh every click |
| `useCreateRun` | `useMutation` | Invalidates `runs` |
| `useRuns` | `()` | Org-wide list |
| `useRunsForAgent` | `(agentId)` | Composed: reads `useRuns` + `useAgentVersions`, filters client-side |
| `useRun` | `(runId)` | |

## 9. Dependencies

- Add `@xyflow/react` (the current name for reactflow v12) for `GraphPreview`.
- No other new runtime deps.

## 10. Environment & scripts

`.env.local-gcp` gains:
```
NEXT_PUBLIC_AGENT_API_URL=http://127.0.0.1:8010
```

`start-local-gcp.sh` adds a third reachability check for the agent builder backend alongside the existing main and AI checks.

`CLAUDE.md` section on API configuration is updated to document the 3-URL pattern (adding the agent builder).

## 11. Error handling

- All client errors surface as toasts via the existing error-toast pattern.
- Dry-run and real-run failures: show the backend error message inline in the run output panel; do not toast (the result is the product).
- Loading skeletons on lists and detail pages follow the existing `Skeleton` component pattern.
- Empty states on `/agents` and the runs tab use the existing empty-state pattern (illustration + primary CTA).

## 12. Open questions resolved during brainstorming

1. **Dry-run input UX** — JSON textarea with validate-on-blur, not a typed form. Backend payload is freeform; a form would have no real schema to validate against today.
2. **Run list scoping** — API exposes only org-wide runs. Client filters by the agent's version IDs. Acceptable for MVP run volumes.
3. **Template descriptions** — hand-written in frontend constants. Cheap to move to the backend later if needed.

## 13. Risks & follow-ups (not blocking MVP)

- The agent backend has no auth beyond the org header. Anyone who can reach the service can act as any org. This matches local-dev posture but will need JWT integration before any shared/staging deployment.
- Echo-stub tool executors mean "runs" today produce uninteresting output. The UI will correctly show the echo payload; users should not mistake this for a finished product.
- When the backend gains per-node config, `AgentOverviewPanel` will likely grow a per-node config section. Plan to extract node-config rendering behind a small registry keyed by `node_type`.

## 14. Deliverable shape

A single feature branch landing in one PR:

- New files under `src/app/agents/`, `src/components/agents/`, `src/hooks/agents/`, `src/lib/api/agents/`, `src/lib/api/agent-base.ts`, `src/types/agents.ts`, `src/lib/agents/template-copy.ts`
- Modifications to `src/app/dashboard/page.tsx` (new stat card + quick action), `src/components/layout/*` (sidebar link), `src/lib/config.ts`, `src/lib/constants.ts`, `.env.example`, `.env.local`, `.env.local-gcp`, `start-local-gcp.sh`, `CLAUDE.md`, `package.json` (`@xyflow/react`)
- No backend changes
