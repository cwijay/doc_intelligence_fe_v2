# Agent Builder UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a scope-A Agent Builder UI: list/create/publish/dry-run/run agents against the `agent_builder_v1` backend on `:8010`, surfaced as a first-class section in the existing Next.js frontend.

**Architecture:** Add a third backend client (alongside Main and AI) with an Axios + React Query layer, a Next.js server-side proxy route for CORS avoidance, new pages under `/agents/*`, a read-only `@xyflow/react` graph preview, and dashboard + sidebar integration.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · TanStack Query · Axios · TailwindCSS 4 · Heroicons · `@xyflow/react` (new).

**Spec reference:** `docs/superpowers/specs/2026-04-19-agent-builder-ui-design.md`.

**Testing posture:** This codebase has no unit test framework. Each task uses manual verification — `npx tsc --noEmit`, `npm run lint`, curl against the running backend, and browser smoke tests. Do not invent fake tests. When a task says "verify" it means running the listed command(s) and confirming the expected output.

**Before you start:** Both backends must be running. Confirm:
```bash
curl -fsS http://127.0.0.1:8000/docs > /dev/null && echo "main ok"
curl -fsS http://127.0.0.1:8001/docs > /dev/null && echo "ai ok"
curl -fsS http://127.0.0.1:8010/docs > /dev/null && echo "agent ok"
```

---

## File map

**New files**

```
src/app/api/agents-backend/[...path]/route.ts   # Next.js proxy to :8010
src/app/agents/page.tsx                         # List page
src/app/agents/new/page.tsx                     # Create wizard page
src/app/agents/[agentId]/page.tsx               # Detail page (tabs)
src/app/agents/[agentId]/test/page.tsx          # Dry-run playground
src/lib/api/agent-base.ts                       # Axios client
src/lib/api/agents/index.ts                     # Barrel
src/lib/api/agents/templates.ts
src/lib/api/agents/agents.ts
src/lib/api/agents/runs.ts
src/lib/api/agents/normalize.ts                 # snake↔camel helpers (agents-only)
src/types/agents.ts                             # Types
src/lib/agents/template-copy.ts                 # Hand-written template descriptions
src/hooks/agents/index.ts
src/hooks/agents/useTemplates.ts
src/hooks/agents/useAgents.ts                   # list/get/CRUD/publish/dryRun/versions
src/hooks/agents/useRuns.ts                     # create/list/get + useRunsForAgent
src/components/agents/index.ts
src/components/agents/AgentList.tsx
src/components/agents/AgentCreateWizard.tsx
src/components/agents/AgentDetailHeader.tsx
src/components/agents/AgentDetailTabs.tsx
src/components/agents/AgentOverviewPanel.tsx
src/components/agents/GraphPreview.tsx
src/components/agents/DryRunPanel.tsx
src/components/agents/RunsList.tsx
src/components/agents/RunDetail.tsx
src/components/agents/JsonViewer.tsx
src/components/agents/JsonEditor.tsx
src/components/agents/RunDialog.tsx
src/components/agents/PublishPopover.tsx
```

**Modified files**

```
src/lib/config.ts                # Add AGENT_API_BASE + proxy helper
src/lib/constants.ts             # Add TIMEOUTS.AGENT_API
src/lib/api/client-factory.ts    # Add AGENT_API_CONFIG
src/components/layout/AppSidebar.tsx    # Add "Agents" nav item
src/components/layout/MobileSidebar.tsx # Same entry for mobile
src/app/dashboard/page.tsx       # Add Agents stat card + quick action
.env.example
.env.local
.env.local-gcp
start-local-gcp.sh
package.json                     # @xyflow/react
CLAUDE.md                        # Document 3-URL pattern
```

---

## Task 1: Environment config plumbing

**Files:**
- Modify: `src/lib/config.ts`
- Modify: `src/lib/constants.ts`
- Modify: `.env.example`
- Modify: `.env.local`
- Modify: `.env.local-gcp`
- Modify: `start-local-gcp.sh`

- [ ] **Step 1.1: Add `AGENT_API_BASE` and helpers to `src/lib/config.ts`**

At the top, after the existing `AI_API_BASE` line, add:

```ts
const AGENT_API_BASE = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:8010';
```

In `clientConfig`, after `ingestApiUrl: ${AI_API_BASE}${API_PATHS.ingest}`, add:

```ts
  // Agent Builder API
  agentApiBaseUrl: AGENT_API_BASE,
```

In the local-proxy section, after `AI_LOCAL_PROXY_BASE_PATH`:

```ts
const AGENT_LOCAL_PROXY_BASE_PATH = '/api/agents-backend';
```

In `isUsingLocalProxy` exports block, after `AI_API_LOCAL_PROXY_PATH`:

```ts
export const AGENT_API_LOCAL_PROXY_PATH = AGENT_LOCAL_PROXY_BASE_PATH;
```

Add a new helper below `getBrowserAiApiBaseUrl`:

```ts
/**
 * Get the Agent Builder API base URL, using local proxy in browser
 */
export const getBrowserAgentApiBaseUrl = (): string => {
  if (shouldUseLocalProxy()) {
    return AGENT_LOCAL_PROXY_BASE_PATH;
  }
  return clientConfig.agentApiBaseUrl;
};
```

In `serverConfig`, after `ingestApiUrl`, add:

```ts
  // Agent Builder API
  agentApiBaseUrl: AGENT_API_BASE,
```

In `logConfigurationSummary`, add `agentApi: clientConfig.agentApiBaseUrl,` next to the others.

In the `__showConfig` dev helper, add a row: `'Agent API': clientConfig.agentApiBaseUrl,`.

- [ ] **Step 1.2: Add `AGENT_API` timeout to `src/lib/constants.ts`**

In the `TIMEOUTS` object (around line 98), add:

```ts
  /** Agent Builder API operations (2 minutes) - synchronous runs */
  AGENT_API: 120000,
```

- [ ] **Step 1.3: Add env var to `.env.example`**

Append to `.env.example`:

```env

# Agent Builder API Configuration
# Local: http://127.0.0.1:8010
NEXT_PUBLIC_AGENT_API_URL=http://127.0.0.1:8010
```

- [ ] **Step 1.4: Add env var to `.env.local`**

Edit `.env.local` — after the `NEXT_PUBLIC_AI_API_URL=` block, insert:

```env

# Agent Builder API (Templates, Agents, Runs)
# Local: http://127.0.0.1:8010
NEXT_PUBLIC_AGENT_API_URL=http://127.0.0.1:8010
```

- [ ] **Step 1.5: Add env var to `.env.local-gcp`**

Edit `.env.local-gcp` — after `NEXT_PUBLIC_AI_API_URL=http://127.0.0.1:8001`, insert:

```env

# Agent Builder API (Templates, Agents, Runs)
NEXT_PUBLIC_AGENT_API_URL=http://127.0.0.1:8010
```

- [ ] **Step 1.6: Add reachability check to `start-local-gcp.sh`**

In the "Required vars sanity check" loop, add `NEXT_PUBLIC_AGENT_API_URL` to the list:

```bash
for var in NEXT_PUBLIC_API_URL NEXT_PUBLIC_AI_API_URL NEXT_PUBLIC_AGENT_API_URL NEXT_PUBLIC_GCS_BUCKET_NAME; do
```

In the backend-reachability section, after the existing `check_backend "AI API" ...` line, add:

```bash
    check_backend "Agent API" "$NEXT_PUBLIC_AGENT_API_URL"
```

In the launch banner block (after `echo "  AI API:         $NEXT_PUBLIC_AI_API_URL"`), add:

```bash
echo "  Agent API:      $NEXT_PUBLIC_AGENT_API_URL"
```

- [ ] **Step 1.7: Verify the build still type-checks**

Run: `npx tsc --noEmit`
Expected: clean output (may show pre-existing warnings unrelated to these files; no new errors).

- [ ] **Step 1.8: Commit**

```bash
git add src/lib/config.ts src/lib/constants.ts .env.example .env.local start-local-gcp.sh
git commit -m "feat(agents): add agent builder env config and reachability check

Adds NEXT_PUBLIC_AGENT_API_URL wiring across config, constants, env
examples, and the local-gcp start script. No runtime code paths use it
yet — that lands in later commits."
```

Note: `.env.local-gcp` is gitignored by design; stage the rest only.

---

## Task 2: Next.js proxy route for the agent builder backend

**Files:**
- Create: `src/app/api/agents-backend/[...path]/route.ts`

- [ ] **Step 2.1: Create the proxy route**

Mirror the AI proxy (`src/app/api/ai/[...path]/route.ts`) but point at `serverConfig.agentApiBaseUrl`.

```ts
import { NextRequest, NextResponse } from 'next/server';
import { serverConfig } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const normalizeSegments = (segments: string[] | undefined): string[] => {
  if (!segments || segments.length === 0) return [];
  return segments.filter(Boolean);
};

const buildTargetUrl = (request: NextRequest, segments: string[], hasTrailingSlash: boolean): URL => {
  let path = segments.join('/');
  if (hasTrailingSlash && path && !path.endsWith('/')) {
    path = `${path}/`;
  }
  const base = serverConfig.agentApiBaseUrl;
  const baseUrl = new URL(base.endsWith('/') ? base : `${base}/`);
  const targetUrl = new URL(path, baseUrl);

  const search = request.nextUrl.search;
  if (search) {
    targetUrl.search = search;
  }
  return targetUrl;
};

const forwardRequest = async (request: NextRequest, context: RouteContext) => {
  try {
    const params = await context.params;
    const segments = normalizeSegments(params.path);
    const hasTrailingSlash = request.nextUrl.pathname.endsWith('/');
    let targetUrl = buildTargetUrl(request, segments, hasTrailingSlash);

    const headers = new Headers(request.headers);
    headers.set('host', targetUrl.host);
    headers.set('origin', targetUrl.origin);
    headers.delete('content-length');
    headers.delete('connection');
    headers.delete('accept-encoding');

    let body: Buffer | undefined;
    if (!['GET', 'HEAD'].includes(request.method)) {
      const arrayBuffer = await request.arrayBuffer();
      if (arrayBuffer.byteLength > 0) {
        body = Buffer.from(arrayBuffer);
      }
    }

    let response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    });

    if (response.status === 307 || response.status === 308) {
      const location = response.headers.get('location');
      if (location) {
        targetUrl = new URL(location, targetUrl);
        headers.set('host', targetUrl.host);
        headers.set('origin', targetUrl.origin);
        response = await fetch(targetUrl, {
          method: request.method,
          headers,
          body,
          redirect: 'manual',
        });
      }
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('connection');

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Agent API proxy error';
    console.error('Agent API proxy error:', message);
    return NextResponse.json(
      { error: 'Agent API proxy request failed', message },
      { status: 502 }
    );
  }
};

export const GET = forwardRequest;
export const POST = forwardRequest;
export const PUT = forwardRequest;
export const PATCH = forwardRequest;
export const DELETE = forwardRequest;
export const OPTIONS = forwardRequest;
export const HEAD = forwardRequest;
```

- [ ] **Step 2.2: Verify proxy with a smoke test**

Start the dev server: `./start-local-gcp.sh` (in a separate shell).
From another shell:

```bash
curl -fsS http://localhost:3000/api/agents-backend/health
```

Expected: a JSON response from the agent backend (e.g. `{"status":"ok"}` or similar — whatever `/health` returns). Non-empty, HTTP 200.

Also test a real endpoint with the required header:

```bash
curl -fsS -H "X-Organization-ID: test-org" http://localhost:3000/api/agents-backend/api/v1/agents/
```

Expected: `[]` (empty list for a fresh org).

- [ ] **Step 2.3: Commit**

```bash
git add src/app/api/agents-backend/
git commit -m "feat(agents): add Next.js proxy route for agent builder API

Mirrors the /api/ai proxy pattern to avoid CORS from the browser and
forward requests to the agent builder backend on :8010."
```

---

## Task 3: Agent API client, types, and template copy

**Files:**
- Create: `src/types/agents.ts`
- Modify: `src/lib/api/client-factory.ts`
- Create: `src/lib/api/agent-base.ts`
- Create: `src/lib/api/agents/normalize.ts`
- Create: `src/lib/api/agents/templates.ts`
- Create: `src/lib/api/agents/agents.ts`
- Create: `src/lib/api/agents/runs.ts`
- Create: `src/lib/api/agents/index.ts`
- Create: `src/lib/agents/template-copy.ts`

- [ ] **Step 3.1: Write `src/types/agents.ts`**

```ts
/**
 * Types for the Agent Builder backend (port 8010).
 * Names mirror the backend schemas in snake_case, but we expose camelCase
 * through the API layer. Both shapes live here for clarity at the wire boundary.
 */

export type AgentMode = 'chat' | 'workflow' | 'hybrid';
export type AgentStatus = 'draft' | 'published';
export type GraphType = 'single_agent' | 'workflow' | 'hybrid' | 'multi_agent';
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed';

// ----- Wire shapes (snake_case from backend) -----

export interface AgentDefinitionWire {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  mode: AgentMode;
  status: AgentStatus;
  draft_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AgentVersionWire {
  id: string;
  agent_definition_id: string;
  organization_id: string;
  version_number: number;
  graph_spec: GraphSpecWire;
  publish_notes: string | null;
  created_at: string;
}

export interface AgentRunWire {
  id: string;
  organization_id: string;
  agent_version_id: string;
  status: RunStatus;
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface GraphNodeWire {
  id: string;
  node_type: string;
  config: Record<string, unknown>;
}

export interface GraphEdgeWire {
  source: string;
  target: string;
}

export interface GraphSpecWire {
  graph_id: string;
  organization_id: string;
  graph_type: GraphType;
  entry_node: string;
  nodes: GraphNodeWire[];
  edges: GraphEdgeWire[];
}

export interface DryRunResultWire {
  organization_id: string;
  agent_id: string;
  graph_spec: GraphSpecWire;
  output: Record<string, unknown>;
}

// ----- Frontend shapes (camelCase) -----

export interface AgentDefinition {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  mode: AgentMode;
  status: AgentStatus;
  draftPayload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentVersion {
  id: string;
  agentDefinitionId: string;
  organizationId: string;
  versionNumber: number;
  graphSpec: GraphSpec;
  publishNotes: string | null;
  createdAt: string;
}

export interface AgentRun {
  id: string;
  organizationId: string;
  agentVersionId: string;
  status: RunStatus;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown> | null;
  createdAt: string;
}

export interface GraphNode {
  id: string;
  nodeType: string;
  config: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphSpec {
  graphId: string;
  organizationId: string;
  graphType: GraphType;
  entryNode: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DryRunResult {
  organizationId: string;
  agentId: string;
  graphSpec: GraphSpec;
  output: Record<string, unknown>;
}

// ----- Create/Update payloads -----

export interface AgentCreateInput {
  name: string;
  description?: string | null;
  mode: AgentMode;
  templateId: string; // wraps into draft_payload = { goal: { agent_type: templateId } }
}

export interface AgentUpdateInput {
  name?: string;
  description?: string | null;
  status?: AgentStatus;
  draftPayload?: Record<string, unknown>;
}

export interface PublishInput {
  publishNotes?: string | null;
}

export interface RunInput {
  inputPayload: Record<string, unknown>;
  dryRun?: boolean; // server default true for dry-run endpoint, false for real run
}

// ----- Templates -----

/** Raw template list endpoint payload. Backend returns only keys. */
export interface TemplateListResponse {
  items: string[];
}

export interface TemplateCopy {
  id: string;
  title: string;
  description: string;
  useCase: string;
  /** Node types in the linear pipeline (mirrors backend catalog). */
  nodeTypes: string[];
}
```

- [ ] **Step 3.2: Write `src/lib/api/agents/normalize.ts`**

```ts
import {
  AgentDefinition, AgentDefinitionWire,
  AgentRun, AgentRunWire,
  AgentVersion, AgentVersionWire,
  DryRunResult, DryRunResultWire,
  GraphSpec, GraphSpecWire,
  AgentUpdateInput,
} from '@/types/agents';

export const normalizeAgent = (w: AgentDefinitionWire): AgentDefinition => ({
  id: w.id,
  organizationId: w.organization_id,
  name: w.name,
  description: w.description,
  mode: w.mode,
  status: w.status,
  draftPayload: w.draft_payload,
  createdAt: w.created_at,
  updatedAt: w.updated_at,
});

export const normalizeGraphSpec = (w: GraphSpecWire): GraphSpec => ({
  graphId: w.graph_id,
  organizationId: w.organization_id,
  graphType: w.graph_type,
  entryNode: w.entry_node,
  nodes: w.nodes.map((n) => ({ id: n.id, nodeType: n.node_type, config: n.config })),
  edges: w.edges.map((e) => ({ source: e.source, target: e.target })),
});

export const normalizeVersion = (w: AgentVersionWire): AgentVersion => ({
  id: w.id,
  agentDefinitionId: w.agent_definition_id,
  organizationId: w.organization_id,
  versionNumber: w.version_number,
  graphSpec: normalizeGraphSpec(w.graph_spec),
  publishNotes: w.publish_notes,
  createdAt: w.created_at,
});

export const normalizeRun = (w: AgentRunWire): AgentRun => ({
  id: w.id,
  organizationId: w.organization_id,
  agentVersionId: w.agent_version_id,
  status: w.status as AgentRun['status'],
  inputPayload: w.input_payload,
  outputPayload: w.output_payload,
  createdAt: w.created_at,
});

export const normalizeDryRun = (w: DryRunResultWire): DryRunResult => ({
  organizationId: w.organization_id,
  agentId: w.agent_id,
  graphSpec: normalizeGraphSpec(w.graph_spec),
  output: w.output,
});

export const toUpdateWire = (u: AgentUpdateInput): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  if (u.name !== undefined) out.name = u.name;
  if (u.description !== undefined) out.description = u.description;
  if (u.status !== undefined) out.status = u.status;
  if (u.draftPayload !== undefined) out.draft_payload = u.draftPayload;
  return out;
};
```

- [ ] **Step 3.3: Add `AGENT_API_CONFIG` to `src/lib/api/client-factory.ts`**

Add the import at the top of the file (alongside existing `getBrowserAiApiBaseUrl`):

```ts
import { clientConfig, getBrowserAiApiBaseUrl, getBrowserAgentApiBaseUrl } from '@/lib/config';
```

At the bottom of the file, after `RAG_API_CONFIG`, add:

```ts
/**
 * Configuration for the Agent Builder API client (port 8010)
 * Note: Agent Builder API expects organization UUID (org_id) in X-Organization-ID header.
 */
export const getAgentApiConfig = (): ApiClientConfig => ({
  baseURL: typeof window !== 'undefined' ? getBrowserAgentApiBaseUrl() : clientConfig.agentApiBaseUrl,
  timeout: TIMEOUTS.AGENT_API,
  serviceName: 'Agent',
  includeOrgHeader: true,
  useOrgName: false, // Agent Builder API uses org_id (UUID), same as Main API
  handleUnauthorized: false, // Agent Builder backend does not auth today
  errorMessages: {
    400: 'Invalid agent payload. Check the draft configuration.',
    404: 'Agent, version, or run not found.',
  },
});
```

In the `getServiceEmoji` function, add an entry for `'Agent': '🧩',`.

- [ ] **Step 3.4: Write `src/lib/api/agent-base.ts`**

```ts
/**
 * Agent Builder API Client (port 8010)
 * Uses the centralized client factory for consistent behavior.
 * Uses local proxy (/api/agents-backend) in the browser to avoid CORS.
 */

import { AxiosInstance } from 'axios';
import { createApiClient, getAgentApiConfig } from './client-factory';
import { getBrowserAgentApiBaseUrl } from '@/lib/config';

const config = getAgentApiConfig();
console.log('🧩 Agent API client configured for:', config.baseURL);

const agentApi: AxiosInstance = createApiClient(config);

export default agentApi;
export { getBrowserAgentApiBaseUrl };
export type { AxiosInstance };
```

- [ ] **Step 3.5: Write `src/lib/api/agents/templates.ts`**

```ts
import agentApi from '@/lib/api/agent-base';
import type { TemplateListResponse } from '@/types/agents';

export const templatesApi = {
  async list(): Promise<string[]> {
    const { data } = await agentApi.get<TemplateListResponse>('/api/v1/templates/');
    return data.items ?? [];
  },
};
```

- [ ] **Step 3.6: Write `src/lib/api/agents/agents.ts`**

```ts
import agentApi from '@/lib/api/agent-base';
import type {
  AgentCreateInput, AgentDefinition, AgentDefinitionWire,
  AgentUpdateInput, AgentVersion, AgentVersionWire,
  DryRunResult, DryRunResultWire,
  PublishInput, RunInput,
} from '@/types/agents';
import { normalizeAgent, normalizeDryRun, normalizeVersion, toUpdateWire } from './normalize';

const toDraftPayload = (templateId: string) => ({
  goal: { agent_type: templateId },
});

export const agentsApi = {
  async list(): Promise<AgentDefinition[]> {
    const { data } = await agentApi.get<AgentDefinitionWire[]>('/api/v1/agents/');
    return data.map(normalizeAgent);
  },

  async get(agentId: string): Promise<AgentDefinition> {
    const { data } = await agentApi.get<AgentDefinitionWire>(`/api/v1/agents/${agentId}`);
    return normalizeAgent(data);
  },

  async create(input: AgentCreateInput): Promise<AgentDefinition> {
    const body = {
      name: input.name,
      description: input.description ?? null,
      mode: input.mode,
      draft_payload: toDraftPayload(input.templateId),
    };
    const { data } = await agentApi.post<AgentDefinitionWire>('/api/v1/agents/', body);
    return normalizeAgent(data);
  },

  async update(agentId: string, input: AgentUpdateInput): Promise<AgentDefinition> {
    const { data } = await agentApi.patch<AgentDefinitionWire>(
      `/api/v1/agents/${agentId}`,
      toUpdateWire(input),
    );
    return normalizeAgent(data);
  },

  async remove(agentId: string): Promise<void> {
    await agentApi.delete(`/api/v1/agents/${agentId}`);
  },

  async publish(agentId: string, input: PublishInput): Promise<AgentVersion> {
    const { data } = await agentApi.post<AgentVersionWire>(
      `/api/v1/agents/${agentId}/publish`,
      { publish_notes: input.publishNotes ?? null },
    );
    return normalizeVersion(data);
  },

  async listVersions(agentId: string): Promise<AgentVersion[]> {
    const { data } = await agentApi.get<AgentVersionWire[]>(
      `/api/v1/agents/${agentId}/versions`,
    );
    return data.map(normalizeVersion);
  },

  async dryRun(agentId: string, input: RunInput): Promise<DryRunResult> {
    const { data } = await agentApi.post<DryRunResultWire>(
      `/api/v1/agents/${agentId}/dry-run`,
      { input_payload: input.inputPayload, dry_run: true },
    );
    return normalizeDryRun(data);
  },
};
```

- [ ] **Step 3.7: Write `src/lib/api/agents/runs.ts`**

```ts
import agentApi from '@/lib/api/agent-base';
import type { AgentRun, AgentRunWire, RunInput } from '@/types/agents';
import { normalizeRun } from './normalize';

export const runsApi = {
  async create(agentId: string, input: RunInput): Promise<AgentRun> {
    const { data } = await agentApi.post<AgentRunWire>(
      `/api/v1/runs/${agentId}`,
      { input_payload: input.inputPayload, dry_run: false },
    );
    return normalizeRun(data);
  },

  async list(): Promise<AgentRun[]> {
    const { data } = await agentApi.get<AgentRunWire[]>('/api/v1/runs/');
    return data.map(normalizeRun);
  },

  async get(runId: string): Promise<AgentRun> {
    const { data } = await agentApi.get<AgentRunWire>(`/api/v1/runs/${runId}`);
    return normalizeRun(data);
  },
};
```

- [ ] **Step 3.8: Write `src/lib/api/agents/index.ts`**

```ts
export { templatesApi } from './templates';
export { agentsApi } from './agents';
export { runsApi } from './runs';
```

- [ ] **Step 3.9: Write `src/lib/agents/template-copy.ts`**

```ts
import type { TemplateCopy } from '@/types/agents';

/**
 * Hand-written copy for known templates. The backend /templates endpoint
 * returns only keys; we enrich them here. Unknown template ids get a
 * generic fallback.
 *
 * NOTE: keep `nodeTypes` in sync with agent_builder_v1/src/agent_builder/templates/catalog.py
 */
export const TEMPLATE_COPY: Record<string, TemplateCopy> = {
  summarize_documents: {
    id: 'summarize_documents',
    title: 'Summarize Documents',
    description: 'Searches your documents and produces a concise summary.',
    useCase: 'Quarterly review briefings, long-report digests.',
    nodeTypes: ['trigger', 'doc.search', 'summarize', 'respond', 'end'],
  },
  document_qa: {
    id: 'document_qa',
    title: 'Document Q&A',
    description: 'Answers questions grounded in your document library.',
    useCase: 'Interactive chat over an org\'s knowledge base.',
    nodeTypes: ['trigger', 'doc.search', 'respond', 'end'],
  },
  extract_structured_data: {
    id: 'extract_structured_data',
    title: 'Extract Structured Data',
    description: 'Reads a document, extracts fields, validates the result.',
    useCase: 'Invoice, contract, or form field extraction.',
    nodeTypes: ['trigger', 'doc.read', 'doc.extract', 'validate', 'respond', 'end'],
  },
};

export const getTemplateCopy = (id: string): TemplateCopy =>
  TEMPLATE_COPY[id] ?? {
    id,
    title: id,
    description: 'Template details unavailable.',
    useCase: '',
    nodeTypes: [],
  };
```

- [ ] **Step 3.10: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors from the files added above.

- [ ] **Step 3.11: Smoke test the client end-to-end via the proxy**

Start dev server if not running. Log in through the UI so the auth headers are populated. Then in the browser devtools console:

```js
await fetch('/api/agents-backend/api/v1/templates/').then(r => r.json())
```

Expected: `{ items: ["summarize_documents", "document_qa", "extract_structured_data"] }`.

- [ ] **Step 3.12: Commit**

```bash
git add src/types/agents.ts src/lib/api/agent-base.ts src/lib/api/agents/ \
        src/lib/api/client-factory.ts src/lib/agents/
git commit -m "feat(agents): add agent builder API client, types, and template copy

- src/types/agents.ts with wire + frontend shapes
- src/lib/api/agents/* thin modules per backend router
- client-factory AGENT_API_CONFIG using org_id header
- src/lib/agents/template-copy.ts for human-readable template labels"
```

---

## Task 4: React Query hooks

**Files:**
- Create: `src/hooks/agents/useTemplates.ts`
- Create: `src/hooks/agents/useAgents.ts`
- Create: `src/hooks/agents/useRuns.ts`
- Create: `src/hooks/agents/index.ts`

- [ ] **Step 4.1: Write `src/hooks/agents/useTemplates.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { templatesApi } from '@/lib/api/agents';

export const AGENT_QUERY_KEYS = {
  templates: ['agent-templates'] as const,
  agents: (orgId: string) => ['agents', orgId] as const,
  agent: (orgId: string, id: string) => ['agents', orgId, id] as const,
  versions: (orgId: string, id: string) => ['agents', orgId, id, 'versions'] as const,
  runs: (orgId: string) => ['agent-runs', orgId] as const,
  run: (orgId: string, id: string) => ['agent-runs', orgId, id] as const,
};

export const useTemplates = (enabled = true) =>
  useQuery({
    queryKey: AGENT_QUERY_KEYS.templates,
    queryFn: () => templatesApi.list(),
    staleTime: 60 * 60 * 1000, // 1 hour — the template set is static
    enabled,
  });
```

- [ ] **Step 4.2: Write `src/hooks/agents/useAgents.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '@/lib/api/agents';
import { authService } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import type {
  AgentCreateInput, AgentUpdateInput, PublishInput, RunInput,
} from '@/types/agents';
import { AGENT_QUERY_KEYS } from './useTemplates';

const hasAuth = () => !!authService.getAccessToken();

export const useAgents = () => {
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.agents(orgId),
    queryFn: () => agentsApi.list(),
    enabled: !!orgId && hasAuth(),
    staleTime: 30 * 1000,
  });
};

export const useAgent = (agentId: string | undefined) => {
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.agent(orgId, agentId || ''),
    queryFn: () => agentsApi.get(agentId as string),
    enabled: !!orgId && !!agentId && hasAuth(),
  });
};

export const useAgentVersions = (agentId: string | undefined) => {
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.versions(orgId, agentId || ''),
    queryFn: () => agentsApi.listVersions(agentId as string),
    enabled: !!orgId && !!agentId && hasAuth(),
  });
};

export const useCreateAgent = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useMutation({
    mutationFn: (input: AgentCreateInput) => agentsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.agents(orgId) }),
  });
};

export const useUpdateAgent = (agentId: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useMutation({
    mutationFn: (input: AgentUpdateInput) => agentsApi.update(agentId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.agents(orgId) });
      qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.agent(orgId, agentId) });
    },
  });
};

export const useDeleteAgent = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useMutation({
    mutationFn: (agentId: string) => agentsApi.remove(agentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.agents(orgId) }),
  });
};

export const usePublishAgent = (agentId: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useMutation({
    mutationFn: (input: PublishInput) => agentsApi.publish(agentId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.agent(orgId, agentId) });
      qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.versions(orgId, agentId) });
      qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.agents(orgId) });
    },
  });
};

export const useDryRun = (agentId: string) =>
  useMutation({
    mutationFn: (input: RunInput) => agentsApi.dryRun(agentId, input),
  });
```

- [ ] **Step 4.3: Write `src/hooks/agents/useRuns.ts`**

```ts
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { runsApi } from '@/lib/api/agents';
import { authService } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import type { AgentRun, RunInput } from '@/types/agents';
import { AGENT_QUERY_KEYS } from './useTemplates';
import { useAgentVersions } from './useAgents';

const hasAuth = () => !!authService.getAccessToken();

export const useRuns = () => {
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.runs(orgId),
    queryFn: () => runsApi.list(),
    enabled: !!orgId && hasAuth(),
    staleTime: 10 * 1000,
  });
};

export const useRun = (runId: string | undefined) => {
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.run(orgId, runId || ''),
    queryFn: () => runsApi.get(runId as string),
    enabled: !!orgId && !!runId && hasAuth(),
  });
};

export const useCreateRun = (agentId: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useMutation({
    mutationFn: (input: RunInput) => runsApi.create(agentId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.runs(orgId) }),
  });
};

/**
 * Client-side filter: org-wide runs narrowed to the given agent's versions.
 * Backend has no per-agent runs endpoint today.
 */
export const useRunsForAgent = (agentId: string | undefined) => {
  const runsQuery = useRuns();
  const versionsQuery = useAgentVersions(agentId);

  const runs = useMemo<AgentRun[]>(() => {
    if (!runsQuery.data || !versionsQuery.data) return [];
    const versionIds = new Set(versionsQuery.data.map((v) => v.id));
    return runsQuery.data.filter((r) => versionIds.has(r.agentVersionId));
  }, [runsQuery.data, versionsQuery.data]);

  return {
    data: runs,
    isLoading: runsQuery.isLoading || versionsQuery.isLoading,
    error: runsQuery.error || versionsQuery.error,
    refetch: runsQuery.refetch,
  };
};
```

- [ ] **Step 4.4: Write `src/hooks/agents/index.ts`**

```ts
export * from './useTemplates';
export * from './useAgents';
export * from './useRuns';
```

- [ ] **Step 4.5: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4.6: Commit**

```bash
git add src/hooks/agents/
git commit -m "feat(agents): add React Query hooks for templates, agents, runs

- AGENT_QUERY_KEYS as the single source of cache keys
- useAgents / useAgent / useAgentVersions with CRUD and publish mutations
- useRuns + useRunsForAgent (client-side filter, since backend runs are org-wide)
- useDryRun as a non-cached mutation"
```

---

## Task 5: Shared UI primitives and graph preview

**Files:**
- Modify: `package.json`
- Create: `src/components/agents/JsonViewer.tsx`
- Create: `src/components/agents/JsonEditor.tsx`
- Create: `src/components/agents/GraphPreview.tsx`
- Create: `src/components/agents/index.ts`

- [ ] **Step 5.1: Install `@xyflow/react`**

Run: `npm install @xyflow/react`
Expected: `package.json` now lists `"@xyflow/react": "^12.x.x"` under dependencies.

- [ ] **Step 5.2: Write `src/components/agents/JsonViewer.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface JsonViewerProps {
  value: unknown;
  label?: string;
  maxHeight?: string;
}

export default function JsonViewer({ value, label, maxHeight = 'max-h-96' }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const pretty = JSON.stringify(value, null, 2);

  const copy = async () => {
    await navigator.clipboard.writeText(pretty);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900">
      <div className="flex items-center justify-between px-3 py-2 border-b border-secondary-200 dark:border-secondary-700">
        <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400">
          {label ?? 'JSON'}
        </span>
        <button
          type="button"
          onClick={copy}
          className="p-1 rounded hover:bg-secondary-200 dark:hover:bg-secondary-800 text-secondary-500"
          title="Copy to clipboard"
        >
          {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
        </button>
      </div>
      <pre className={`p-3 text-xs font-mono overflow-auto ${maxHeight} text-secondary-800 dark:text-secondary-200`}>
        {pretty}
      </pre>
    </div>
  );
}
```

- [ ] **Step 5.3: Write `src/components/agents/JsonEditor.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';

interface JsonEditorProps {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}

/**
 * Plain textarea JSON editor with validate-on-blur. Intentionally
 * low-dep: no Monaco. Error surfaces below the textarea only after
 * the user blurs so they can type freely.
 */
export default function JsonEditor({
  value, onChange, label = 'Input payload', placeholder, rows = 10,
}: JsonEditorProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [value]);

  const validate = () => {
    if (!value.trim()) {
      setError(null);
      return;
    }
    try {
      JSON.parse(value);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={validate}
        rows={rows}
        spellCheck={false}
        placeholder={placeholder}
        className="w-full font-mono text-sm p-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      {error && (
        <p className="text-xs text-error-600 dark:text-error-400">JSON error: {error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 5.4: Write `src/components/agents/GraphPreview.tsx`**

```tsx
'use client';

import { useMemo } from 'react';
import {
  ReactFlow, Background, Controls, MarkerType,
  type Node as RFNode, type Edge as RFEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { GraphSpec } from '@/types/agents';

interface GraphPreviewProps {
  spec: GraphSpec;
  height?: string;
}

const NODE_WIDTH = 180;
const NODE_GAP = 80;

/**
 * Read-only left-to-right layout. All current backend templates are
 * linear, so a simple x-offset layout is enough.
 */
export default function GraphPreview({ spec, height = 'h-80' }: GraphPreviewProps) {
  const { nodes, edges } = useMemo(() => {
    const rfNodes: RFNode[] = spec.nodes.map((n, idx) => ({
      id: n.id,
      position: { x: idx * (NODE_WIDTH + NODE_GAP), y: 0 },
      data: { label: n.nodeType },
      style: {
        width: NODE_WIDTH,
        padding: 8,
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        fontFamily: 'var(--font-inter, system-ui)',
        fontSize: 13,
        textAlign: 'center' as const,
      },
      sourcePosition: 'right' as const,
      targetPosition: 'left' as const,
    }));
    const rfEdges: RFEdge[] = spec.edges.map((e) => ({
      id: `${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      markerEnd: { type: MarkerType.ArrowClosed },
    }));
    return { nodes: rfNodes, edges: rfEdges };
  }, [spec]);

  return (
    <div className={`${height} rounded-lg border border-secondary-200 dark:border-secondary-700`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 5.5: Write `src/components/agents/index.ts`**

```ts
export { default as JsonViewer } from './JsonViewer';
export { default as JsonEditor } from './JsonEditor';
export { default as GraphPreview } from './GraphPreview';
```

- [ ] **Step 5.6: Verify typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 5.7: Commit**

```bash
git add package.json package-lock.json src/components/agents/
git commit -m "feat(agents): add shared UI primitives (JsonViewer, JsonEditor, GraphPreview)

Adds @xyflow/react as a dependency for read-only graph preview. All
current templates are linear, so GraphPreview lays nodes out left-to-right."
```

---

## Task 6: Agent list page

**Files:**
- Create: `src/components/agents/AgentList.tsx`
- Create: `src/app/agents/page.tsx`
- Modify: `src/components/agents/index.ts`

- [ ] **Step 6.1: Write `src/components/agents/AgentList.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAgents, useDeleteAgent } from '@/hooks/agents';
import toast from 'react-hot-toast';

export default function AgentList() {
  const { data: agents = [], isLoading, error } = useAgents();
  const deleteAgent = useDeleteAgent();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete agent "${name}"? This cannot be undone.`)) return;
    try {
      await deleteAgent.mutateAsync(id);
      toast.success('Agent deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6 text-sm text-secondary-500">Loading agents…</CardContent></Card>;
  }
  if (error) {
    return <Card><CardContent className="p-6 text-sm text-error-600">Failed to load agents.</CardContent></Card>;
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-2">
            No agents yet
          </h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">
            Create an agent from a template to get started.
          </p>
          <Link href="/agents/new">
            <Button icon={<PlusIcon className="w-4 h-4" />}>New Agent</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-secondary-50 dark:bg-secondary-900 text-xs uppercase text-secondary-500">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Mode</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Updated</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {agents.map((a) => (
              <tr key={a.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900/50">
                <td className="px-4 py-3">
                  <Link href={`/agents/${a.id}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                    {a.name}
                  </Link>
                  {a.description && (
                    <p className="text-xs text-secondary-500 mt-0.5 line-clamp-1">{a.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{a.mode}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    a.status === 'published'
                      ? 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300'
                      : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300'
                  }`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-secondary-600 dark:text-secondary-400">
                  {format(new Date(a.updatedAt), 'PP')}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id, a.name)}
                    className="p-1.5 rounded hover:bg-error-50 dark:hover:bg-error-900/30 text-secondary-500 hover:text-error-600"
                    title="Delete agent"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
```

- [ ] **Step 6.2: Add `AgentList` to the components barrel**

Edit `src/components/agents/index.ts`, append:

```ts
export { default as AgentList } from './AgentList';
```

- [ ] **Step 6.3: Write `src/app/agents/page.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { PlusIcon, BoltIcon } from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout';
import AuthGuard from '@/components/guards/AuthGuard';
import Button from '@/components/ui/Button';
import { AgentList } from '@/components/agents';

export default function AgentsPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-poppins font-bold text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
                <BoltIcon className="w-7 h-7 text-primary-500" />
                Agents
              </h1>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                Build, publish, and run AI agents for your organization.
              </p>
            </div>
            <Link href="/agents/new">
              <Button icon={<PlusIcon className="w-4 h-4" />}>New Agent</Button>
            </Link>
          </div>
          <AgentList />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
```

- [ ] **Step 6.4: Verify in browser**

Run the dev server, navigate to `http://localhost:3000/agents` (after logging in).
Expected: the page renders; shows empty state because no agents exist yet; "New Agent" button is visible.

- [ ] **Step 6.5: Commit**

```bash
git add src/components/agents/AgentList.tsx src/components/agents/index.ts src/app/agents/page.tsx
git commit -m "feat(agents): add agent list page

Empty state with CTA, table view with name/mode/status/updated/actions,
delete with confirm."
```

---

## Task 7: Create wizard

**Files:**
- Create: `src/components/agents/AgentCreateWizard.tsx`
- Create: `src/app/agents/new/page.tsx`
- Modify: `src/components/agents/index.ts`

- [ ] **Step 7.1: Write `src/components/agents/AgentCreateWizard.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTemplates, useCreateAgent } from '@/hooks/agents';
import { getTemplateCopy } from '@/lib/agents/template-copy';
import type { AgentMode } from '@/types/agents';
import toast from 'react-hot-toast';

const MODES: { value: AgentMode; label: string; hint: string }[] = [
  { value: 'workflow', label: 'Workflow', hint: 'Deterministic pipeline of steps.' },
  { value: 'chat', label: 'Chat', hint: 'Conversational agent (coming soon — stored but runs as workflow today).' },
  { value: 'hybrid', label: 'Hybrid', hint: 'Mix of workflow + chat (coming soon).' },
];

export default function AgentCreateWizard() {
  const router = useRouter();
  const { data: templateIds = [], isLoading: loadingTemplates } = useTemplates();
  const createAgent = useCreateAgent();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<AgentMode>('workflow');
  const [templateId, setTemplateId] = useState<string | null>(null);

  const canContinue1 = name.trim().length > 0;
  const canContinue2 = !!mode;
  const canSubmit = !!templateId && canContinue1 && canContinue2;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      const agent = await createAgent.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        mode,
        templateId: templateId as string,
      });
      toast.success('Agent created');
      router.push(`/agents/${agent.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed');
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <Stepper step={step} />

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Basics</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-secondary-300 dark:border-secondary-700 px-3 py-2 bg-white dark:bg-secondary-900"
                placeholder="e.g. Weekly summary bot"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-secondary-300 dark:border-secondary-700 px-3 py-2 bg-white dark:bg-secondary-900"
                placeholder="Optional: what does this agent do?"
              />
            </div>
            <div className="flex justify-end">
              <Button disabled={!canContinue1} onClick={() => setStep(2)}>Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Mode</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={`text-left p-4 rounded-lg border-2 transition ${
                    mode === m.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-400'
                  }`}
                >
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{m.hint}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button disabled={!canContinue2} onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Template</h2>
            {loadingTemplates ? (
              <p className="text-sm text-secondary-500">Loading templates…</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {templateIds.map((id) => {
                  const copy = getTemplateCopy(id);
                  const selected = templateId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTemplateId(id)}
                      className={`text-left p-4 rounded-lg border-2 transition ${
                        selected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-400'
                      }`}
                    >
                      <div className="font-semibold">{copy.title}</div>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{copy.description}</p>
                      <p className="text-xs text-secondary-500 mt-2 italic">{copy.useCase}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {copy.nodeTypes.map((nt) => (
                          <span key={nt} className="px-2 py-0.5 rounded text-xs bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300">
                            {nt}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button disabled={!canSubmit || createAgent.isPending} onClick={submit}>
                {createAgent.isPending ? 'Creating…' : 'Create agent'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ['Basics', 'Mode', 'Template'];
  return (
    <div className="flex items-center gap-2 text-xs">
      {steps.map((label, idx) => {
        const n = idx + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${
              active ? 'bg-primary-500 text-white' :
              done ? 'bg-success-500 text-white' :
              'bg-secondary-200 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300'
            }`}>
              {n}
            </div>
            <span className={active ? 'font-medium' : 'text-secondary-500'}>{label}</span>
            {n < steps.length && <div className="w-8 h-px bg-secondary-300 dark:bg-secondary-700" />}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 7.2: Add to barrel**

Edit `src/components/agents/index.ts`, append:

```ts
export { default as AgentCreateWizard } from './AgentCreateWizard';
```

- [ ] **Step 7.3: Write `src/app/agents/new/page.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout';
import AuthGuard from '@/components/guards/AuthGuard';
import { AgentCreateWizard } from '@/components/agents';

export default function NewAgentPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/agents" className="inline-flex items-center gap-1 text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 mb-4">
            <ArrowLeftIcon className="w-4 h-4" /> Back to agents
          </Link>
          <h1 className="text-2xl font-poppins font-bold text-secondary-900 dark:text-secondary-100 mb-6">
            New agent
          </h1>
          <AgentCreateWizard />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
```

- [ ] **Step 7.4: Verify in browser**

Navigate to `/agents/new`. Walk through the wizard. Create an agent. 
Expected: you land on `/agents/[agentId]` (the detail page will 404 for now — that's fine; Task 8 builds it). `/agents` now lists the new agent.

- [ ] **Step 7.5: Commit**

```bash
git add src/components/agents/AgentCreateWizard.tsx src/components/agents/index.ts src/app/agents/new/
git commit -m "feat(agents): add three-step agent create wizard

Basics -> Mode -> Template. Template cards show description, use case,
and node pipeline chips. Submits with draft_payload.goal.agent_type."
```

---

## Task 8: Agent detail page (Overview + Graph + shared header)

**Files:**
- Create: `src/components/agents/AgentDetailHeader.tsx`
- Create: `src/components/agents/PublishPopover.tsx`
- Create: `src/components/agents/RunDialog.tsx`
- Create: `src/components/agents/AgentOverviewPanel.tsx`
- Create: `src/components/agents/AgentDetailTabs.tsx`
- Create: `src/app/agents/[agentId]/page.tsx`
- Modify: `src/components/agents/index.ts`

- [ ] **Step 8.1: Write `src/components/agents/AgentDetailHeader.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { PlayIcon, BeakerIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import type { AgentDefinition } from '@/types/agents';
import PublishPopover from './PublishPopover';
import RunDialog from './RunDialog';
import { useState } from 'react';

interface Props {
  agent: AgentDefinition;
}

export default function AgentDetailHeader({ agent }: Props) {
  const [runOpen, setRunOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Link href="/agents" className="inline-flex items-center gap-1 text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600">
        <ArrowLeftIcon className="w-4 h-4" /> Back to agents
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-secondary-900 dark:text-secondary-100">
            {agent.name}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 capitalize">
              {agent.mode}
            </span>
            <span className={`px-2 py-0.5 rounded-full ${
              agent.status === 'published'
                ? 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300'
                : 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300'
            }`}>
              {agent.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/agents/${agent.id}/test`}>
            <Button variant="outline" icon={<BeakerIcon className="w-4 h-4" />}>Dry Run</Button>
          </Link>
          <PublishPopover agentId={agent.id} />
          {agent.status === 'published' && (
            <Button icon={<PlayIcon className="w-4 h-4" />} onClick={() => setRunOpen(true)}>
              Run
            </Button>
          )}
        </div>
      </div>
      <RunDialog agentId={agent.id} open={runOpen} onClose={() => setRunOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 8.2: Write `src/components/agents/PublishPopover.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { usePublishAgent } from '@/hooks/agents';
import toast from 'react-hot-toast';

interface Props {
  agentId: string;
}

export default function PublishPopover({ agentId }: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const publish = usePublishAgent(agentId);

  const submit = async () => {
    try {
      await publish.mutateAsync({ publishNotes: notes.trim() || null });
      toast.success('Agent published');
      setOpen(false);
      setNotes('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Publish failed');
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        icon={<PaperAirplaneIcon className="w-4 h-4" />}
        onClick={() => setOpen((o) => !o)}
      >
        Publish
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 shadow-xl p-4 z-20">
          <label className="block text-sm font-medium mb-1">Publish notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="What changed in this version?"
            className="w-full rounded-lg border border-secondary-300 dark:border-secondary-700 px-3 py-2 text-sm bg-white dark:bg-secondary-900"
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={publish.isPending}>
              {publish.isPending ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8.3: Write `src/components/agents/RunDialog.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import JsonEditor from './JsonEditor';
import JsonViewer from './JsonViewer';
import { useCreateRun } from '@/hooks/agents';
import toast from 'react-hot-toast';
import type { AgentRun } from '@/types/agents';

interface Props {
  agentId: string;
  open: boolean;
  onClose: () => void;
}

const DEFAULT_INPUT = `{\n  "query": "hello"\n}`;

export default function RunDialog({ agentId, open, onClose }: Props) {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [result, setResult] = useState<AgentRun | null>(null);
  const createRun = useCreateRun(agentId);

  if (!open) return null;

  const submit = async () => {
    let payload: Record<string, unknown>;
    try {
      payload = input.trim() ? JSON.parse(input) : {};
    } catch (e) {
      toast.error(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
      return;
    }
    try {
      const run = await createRun.mutateAsync({ inputPayload: payload });
      setResult(run);
      toast.success('Run completed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Run failed');
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-secondary-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Run agent</h3>
          <button onClick={onClose} className="text-secondary-500 hover:text-secondary-800">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <JsonEditor value={input} onChange={setInput} rows={8} />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={createRun.isPending}>
              {createRun.isPending ? 'Running…' : 'Run'}
            </Button>
          </div>
          {result && (
            <div className="space-y-3">
              <div className="text-sm">
                Status: <span className="font-medium">{result.status}</span>
              </div>
              <JsonViewer value={result.outputPayload ?? {}} label="Output" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8.4: Write `src/components/agents/AgentOverviewPanel.tsx`**

```tsx
'use client';

import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/Card';
import { useAgentVersions } from '@/hooks/agents';
import { getTemplateCopy } from '@/lib/agents/template-copy';
import type { AgentDefinition } from '@/types/agents';

interface Props {
  agent: AgentDefinition;
}

const extractTemplateId = (payload: Record<string, unknown>): string | null => {
  const goal = payload.goal as Record<string, unknown> | undefined;
  const id = goal?.agent_type;
  return typeof id === 'string' ? id : null;
};

export default function AgentOverviewPanel({ agent }: Props) {
  const { data: versions = [], isLoading: loadingVersions } = useAgentVersions(agent.id);
  const templateId = extractTemplateId(agent.draftPayload);
  const template = templateId ? getTemplateCopy(templateId) : null;
  const latestVersion = versions[0];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase">Metadata</h3>
          <dl className="text-sm space-y-2">
            <Row label="ID" value={<span className="font-mono text-xs">{agent.id}</span>} />
            <Row label="Mode" value={<span className="capitalize">{agent.mode}</span>} />
            <Row label="Status" value={agent.status} />
            <Row label="Created" value={format(new Date(agent.createdAt), 'PP p')} />
            <Row label="Updated" value={format(new Date(agent.updatedAt), 'PP p')} />
            {agent.description && <Row label="Description" value={agent.description} />}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase">Template</h3>
          {template ? (
            <>
              <div className="font-semibold">{template.title}</div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">{template.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {template.nodeTypes.map((nt) => (
                  <span key={nt} className="px-2 py-0.5 rounded text-xs bg-secondary-100 dark:bg-secondary-800">
                    {nt}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-secondary-500">No template recorded in draft payload.</p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase mb-3">Latest version</h3>
          {loadingVersions ? (
            <p className="text-sm text-secondary-500">Loading…</p>
          ) : latestVersion ? (
            <div className="text-sm space-y-1">
              <div>Version <span className="font-medium">#{latestVersion.versionNumber}</span></div>
              <div className="text-secondary-600 dark:text-secondary-400">Published {format(new Date(latestVersion.createdAt), 'PP p')}</div>
              {latestVersion.publishNotes && (
                <p className="mt-2 text-secondary-700 dark:text-secondary-300 italic">&ldquo;{latestVersion.publishNotes}&rdquo;</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-secondary-500">
              Not published yet. Use the <strong>Publish</strong> button to snapshot the current draft.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 text-secondary-500 dark:text-secondary-400">{label}</dt>
      <dd className="flex-1 text-secondary-800 dark:text-secondary-200">{value}</dd>
    </div>
  );
}
```

- [ ] **Step 8.5: Write `src/components/agents/AgentDetailTabs.tsx`**

```tsx
'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { AgentDefinition } from '@/types/agents';
import AgentOverviewPanel from './AgentOverviewPanel';
import GraphTabPanel from './GraphTabPanel';
import RunsTabPanel from './RunsTabPanel';

interface Props {
  agent: AgentDefinition;
}

const TABS = ['Overview', 'Graph', 'Runs'] as const;
type TabName = typeof TABS[number];

export default function AgentDetailTabs({ agent }: Props) {
  const [tab, setTab] = useState<TabName>('Overview');
  return (
    <div>
      <div className="border-b border-secondary-200 dark:border-secondary-700 mb-5">
        <nav className="flex gap-6">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={clsx(
                'py-3 text-sm font-medium border-b-2 transition',
                tab === t
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100',
              )}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'Overview' && <AgentOverviewPanel agent={agent} />}
      {tab === 'Graph' && <GraphTabPanel agent={agent} />}
      {tab === 'Runs' && <RunsTabPanel agent={agent} />}
    </div>
  );
}
```

Note: `GraphTabPanel` and `RunsTabPanel` are introduced in the next steps.

- [ ] **Step 8.6: Write `src/components/agents/GraphTabPanel.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import GraphPreview from './GraphPreview';
import { useAgentVersions, useDryRun } from '@/hooks/agents';
import type { AgentDefinition, GraphSpec } from '@/types/agents';

interface Props {
  agent: AgentDefinition;
}

export default function GraphTabPanel({ agent }: Props) {
  const { data: versions = [] } = useAgentVersions(agent.id);
  const dryRun = useDryRun(agent.id);
  const publishedSpec: GraphSpec | undefined = versions[0]?.graphSpec;

  useEffect(() => {
    if (!publishedSpec && !dryRun.data && !dryRun.isPending && !dryRun.error) {
      dryRun.mutate({ inputPayload: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishedSpec]);

  const spec = publishedSpec ?? dryRun.data?.graphSpec;

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase">
            Compiled graph
          </h3>
          {publishedSpec ? (
            <span className="text-xs text-secondary-500">
              Showing latest published version
            </span>
          ) : (
            <span className="text-xs text-secondary-500">
              Preview compiled from current draft (dry-run)
            </span>
          )}
        </div>
        {spec ? (
          <GraphPreview spec={spec} />
        ) : dryRun.error ? (
          <p className="text-sm text-error-600">
            Could not compile graph: {dryRun.error instanceof Error ? dryRun.error.message : 'unknown error'}
          </p>
        ) : (
          <p className="text-sm text-secondary-500">Compiling…</p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 8.7: Write `src/components/agents/RunsTabPanel.tsx` (stub for now)**

RunsList and RunDetail land in Task 9 — for now, a placeholder to unblock the tabs.

```tsx
'use client';

import type { AgentDefinition } from '@/types/agents';
import RunsList from './RunsList';

interface Props {
  agent: AgentDefinition;
}

export default function RunsTabPanel({ agent }: Props) {
  return <RunsList agentId={agent.id} />;
}
```

- [ ] **Step 8.8: Add a minimal `src/components/agents/RunsList.tsx` placeholder**

Temporary — replaced in Task 9. Keeps imports satisfied so Task 8 can ship.

```tsx
'use client';

interface Props {
  agentId: string;
}

export default function RunsList({ agentId: _agentId }: Props) {
  return (
    <div className="p-6 rounded-lg border border-dashed border-secondary-300 dark:border-secondary-700 text-sm text-secondary-500 text-center">
      Runs list coming in the next task.
    </div>
  );
}
```

- [ ] **Step 8.9: Update barrel**

Edit `src/components/agents/index.ts`, append:

```ts
export { default as AgentDetailHeader } from './AgentDetailHeader';
export { default as AgentDetailTabs } from './AgentDetailTabs';
export { default as AgentOverviewPanel } from './AgentOverviewPanel';
export { default as GraphTabPanel } from './GraphTabPanel';
export { default as RunsTabPanel } from './RunsTabPanel';
export { default as RunsList } from './RunsList';
export { default as PublishPopover } from './PublishPopover';
export { default as RunDialog } from './RunDialog';
```

- [ ] **Step 8.10: Write `src/app/agents/[agentId]/page.tsx`**

```tsx
'use client';

import { use } from 'react';
import { AppLayout } from '@/components/layout';
import AuthGuard from '@/components/guards/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { useAgent } from '@/hooks/agents';
import { AgentDetailHeader, AgentDetailTabs } from '@/components/agents';

interface Params {
  agentId: string;
}

export default function AgentDetailPage({ params }: { params: Promise<Params> }) {
  const { agentId } = use(params);
  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AgentDetailInner agentId={agentId} />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

function AgentDetailInner({ agentId }: { agentId: string }) {
  const { data: agent, isLoading, error } = useAgent(agentId);

  if (isLoading) {
    return <Card><CardContent className="p-8 text-sm text-secondary-500">Loading agent…</CardContent></Card>;
  }
  if (error || !agent) {
    return <Card><CardContent className="p-8 text-sm text-error-600">Agent not found.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <AgentDetailHeader agent={agent} />
      <AgentDetailTabs agent={agent} />
    </div>
  );
}
```

- [ ] **Step 8.11: Verify in browser**

Navigate to the agent created in Task 7 (`/agents/[id]`). 
Expected: header with name/mode/status renders. Overview tab shows metadata + template + "Not published yet". Graph tab compiles on mount and shows a 5-node (or fewer) left-to-right graph. Runs tab shows the placeholder. Publish action with empty notes succeeds; Overview updates to show version #1; status becomes "published"; a **Run** button appears.

- [ ] **Step 8.12: Commit**

```bash
git add src/components/agents/ src/app/agents/\[agentId\]/
git commit -m "feat(agents): add agent detail page with Overview, Graph, Runs tabs

- AgentDetailHeader with Dry Run / Publish / Run buttons
- PublishPopover with optional notes
- RunDialog for real runs against latest published version
- AgentOverviewPanel with metadata, template card, latest version
- GraphTabPanel: uses published spec when available, else dry-run preview
- RunsList placeholder (filled in next task)"
```

---

## Task 9: Runs tab (list + detail drawer)

**Files:**
- Modify: `src/components/agents/RunsList.tsx` (replace placeholder)
- Create: `src/components/agents/RunDetail.tsx`
- Modify: `src/components/agents/index.ts`

- [ ] **Step 9.1: Replace `src/components/agents/RunsList.tsx` with the real implementation**

```tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { useRunsForAgent } from '@/hooks/agents';
import type { AgentRun } from '@/types/agents';
import RunDetail from './RunDetail';

interface Props {
  agentId: string;
}

export default function RunsList({ agentId }: Props) {
  const { data: runs, isLoading, error } = useRunsForAgent(agentId);
  const [selected, setSelected] = useState<AgentRun | null>(null);

  if (isLoading) {
    return <Card><div className="p-6 text-sm text-secondary-500">Loading runs…</div></Card>;
  }
  if (error) {
    return <Card><div className="p-6 text-sm text-error-600">Failed to load runs.</div></Card>;
  }
  if (!runs || runs.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center text-sm text-secondary-500">
          No runs yet. Publish and run the agent to see results here.
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary-50 dark:bg-secondary-900 text-xs uppercase text-secondary-500">
              <tr>
                <th className="text-left px-4 py-3">Run ID</th>
                <th className="text-left px-4 py-3">Version</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {runs.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-secondary-50 dark:hover:bg-secondary-900/50 cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <td className="px-4 py-3 font-mono text-xs">{r.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.agentVersionId.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-secondary-600 dark:text-secondary-400">
                    {format(new Date(r.createdAt), 'PP p')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {selected && <RunDetail run={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function StatusPill({ status }: { status: AgentRun['status'] }) {
  const cls = {
    pending: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300',
    running: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
    completed: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
    failed: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300',
  }[status];
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}
```

- [ ] **Step 9.2: Write `src/components/agents/RunDetail.tsx`**

```tsx
'use client';

import { format } from 'date-fns';
import type { AgentRun } from '@/types/agents';
import JsonViewer from './JsonViewer';

interface Props {
  run: AgentRun;
  onClose: () => void;
}

export default function RunDetail({ run, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex" role="dialog" aria-modal="true">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <aside className="w-full max-w-xl h-full bg-white dark:bg-secondary-900 shadow-2xl overflow-auto">
        <div className="p-5 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Run detail</h3>
            <p className="text-xs font-mono text-secondary-500">{run.id}</p>
          </div>
          <button onClick={onClose} className="text-secondary-500 hover:text-secondary-800">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <dl className="text-sm space-y-2">
            <Row label="Status" value={run.status} />
            <Row label="Version" value={<span className="font-mono text-xs">{run.agentVersionId}</span>} />
            <Row label="Created" value={format(new Date(run.createdAt), 'PP p')} />
          </dl>
          <JsonViewer value={run.inputPayload} label="Input" />
          <JsonViewer value={run.outputPayload ?? { note: 'No output recorded' }} label="Output" />
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-20 text-secondary-500">{label}</dt>
      <dd className="flex-1 text-secondary-800 dark:text-secondary-200">{value}</dd>
    </div>
  );
}
```

- [ ] **Step 9.3: Update the barrel**

Edit `src/components/agents/index.ts` to add `RunDetail` (if not already present via earlier step, confirm it's exported):

```ts
export { default as RunDetail } from './RunDetail';
```

- [ ] **Step 9.4: Verify in browser**

Go to a published agent, click **Run** in the header, submit the default `{"query":"hello"}`.
Expected: toast "Run completed". Click the Runs tab: table shows the new run. Click the row: right-side drawer opens with input + output JSON.

- [ ] **Step 9.5: Commit**

```bash
git add src/components/agents/RunsList.tsx src/components/agents/RunDetail.tsx src/components/agents/index.ts
git commit -m "feat(agents): replace runs placeholder with list + side-drawer detail

Filters org-wide runs by the agent's version IDs client-side (backend
has no per-agent runs endpoint). Row click opens a drawer with JSON
viewers for input/output."
```

---

## Task 10: Dry-run playground page

**Files:**
- Create: `src/components/agents/DryRunPanel.tsx`
- Create: `src/app/agents/[agentId]/test/page.tsx`
- Modify: `src/components/agents/index.ts`

- [ ] **Step 10.1: Write `src/components/agents/DryRunPanel.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useDryRun } from '@/hooks/agents';
import JsonEditor from './JsonEditor';
import JsonViewer from './JsonViewer';
import GraphPreview from './GraphPreview';
import toast from 'react-hot-toast';

interface Props {
  agentId: string;
}

const DEFAULT_INPUT = `{\n  "query": "hello"\n}`;

export default function DryRunPanel({ agentId }: Props) {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const dryRun = useDryRun(agentId);

  const submit = async () => {
    let payload: Record<string, unknown>;
    try {
      payload = input.trim() ? JSON.parse(input) : {};
    } catch (e) {
      toast.error(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
      return;
    }
    try {
      await dryRun.mutateAsync({ inputPayload: payload });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Dry run failed');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase">Input</h3>
          <JsonEditor value={input} onChange={setInput} rows={14} />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={dryRun.isPending}>
              {dryRun.isPending ? 'Running…' : 'Dry run'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase">Output</h3>
          {dryRun.error && (
            <p className="text-sm text-error-600">
              {dryRun.error instanceof Error ? dryRun.error.message : 'Unknown error'}
            </p>
          )}
          {dryRun.data ? (
            <>
              <JsonViewer value={dryRun.data.output} label="Output payload" />
              <GraphPreview spec={dryRun.data.graphSpec} height="h-48" />
            </>
          ) : (
            <p className="text-sm text-secondary-500">Run the agent to see output and the compiled graph.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 10.2: Update the barrel**

Edit `src/components/agents/index.ts`:

```ts
export { default as DryRunPanel } from './DryRunPanel';
```

- [ ] **Step 10.3: Write `src/app/agents/[agentId]/test/page.tsx`**

```tsx
'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout';
import AuthGuard from '@/components/guards/AuthGuard';
import { useAgent } from '@/hooks/agents';
import { DryRunPanel } from '@/components/agents';

export default function DryRunPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <Link href={`/agents/${agentId}`} className="inline-flex items-center gap-1 text-sm text-secondary-600 hover:text-primary-600">
            <ArrowLeftIcon className="w-4 h-4" /> Back to agent
          </Link>
          <Header agentId={agentId} />
          <DryRunPanel agentId={agentId} />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

function Header({ agentId }: { agentId: string }) {
  const { data: agent } = useAgent(agentId);
  return (
    <div>
      <h1 className="text-2xl font-poppins font-bold text-secondary-900 dark:text-secondary-100">
        Dry run {agent ? `— ${agent.name}` : ''}
      </h1>
      <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
        Compile the current draft and run it without creating a real run record.
      </p>
    </div>
  );
}
```

- [ ] **Step 10.4: Verify in browser**

From the agent detail page, click **Dry Run** → lands on `/agents/[id]/test`. Submit default input.
Expected: output JSON appears (echo-stub: a `step_results` array) and a small graph preview. Invalid JSON shows an error toast.

- [ ] **Step 10.5: Commit**

```bash
git add src/components/agents/DryRunPanel.tsx src/components/agents/index.ts src/app/agents/\[agentId\]/test/
git commit -m "feat(agents): add dry-run playground page

Two-column layout with JSON input on the left and output + compiled
graph on the right. Uses useDryRun mutation — result is not cached."
```

---

## Task 11: Navigation integration (sidebar + dashboard)

**Files:**
- Modify: `src/components/layout/AppSidebar.tsx`
- Modify: `src/components/layout/MobileSidebar.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 11.1: Add "Agents" to `AppSidebar.tsx`**

Edit the import list near the top to include `BoltIcon`:

```ts
import {
  DocumentTextIcon,
  ChartBarIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  SparklesIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  DocumentChartBarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
```

Insert the new entry in the `navigation` array between `Documents` and `Reports`:

```ts
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
  { name: 'Agents', href: '/agents', icon: BoltIcon },
  { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
  { name: 'Usage', href: '/usage', icon: ChartPieIcon },
  { name: 'Insights', href: '/insights', icon: LightBulbIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];
```

- [ ] **Step 11.2: Mirror the entry in `MobileSidebar.tsx`**

Open `src/components/layout/MobileSidebar.tsx`. Find the equivalent navigation array (it matches the shape in `AppSidebar.tsx`). Add the same import and the same `{ name: 'Agents', href: '/agents', icon: BoltIcon }` entry in the same position.

If the file uses a shared list from elsewhere, reuse that list — inspect the file first and follow the existing pattern.

- [ ] **Step 11.3: Add Agents stat card + quick action to `src/app/dashboard/page.tsx`**

Imports: add `BoltIcon` if not present (it already is from earlier usage), and `useAgents`:

```ts
import { BoltIcon, ... } from '@heroicons/react/24/outline';
import { useAgents } from '@/hooks/agents';
```

Inside `DashboardContent`, after the existing `useDocuments` call, add:

```tsx
  const { data: agentsData, isLoading: agentsLoading, error: agentsError } = useAgents();
```

In the `stats` array, insert a new entry after the Documents card and before API Usage:

```ts
    {
      name: 'Agents',
      value: agentsLoading ? '...' : (agentsError ? 'Error' : (agentsData?.length ?? 0).toString()),
      change: agentsLoading ? 'Loading...' : (agentsError ? 'API Error' : `${agentsData?.length ? '+' : ''}${agentsData?.length ?? 0}`),
      changeType: agentsError ? 'decrease' as const : 'increase' as const,
      icon: BoltIcon,
      description: agentsLoading
        ? 'Loading agents…'
        : agentsError
          ? 'Unable to load agents'
          : `${agentsData?.length ?? 0} agent${(agentsData?.length ?? 0) === 1 ? '' : 's'} configured`,
      link: '/agents',
    },
```

(The grid already handles 4 columns; with 4 cards the layout remains consistent.)

In the Quick Actions `<div className="space-y-3">`, add a new button after **View Reports**:

```tsx
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    icon={<BoltIcon className="w-4 h-4" />}
                    onClick={() => router.push('/agents/new')}
                  >
                    Create Agent
                  </Button>
```

- [ ] **Step 11.4: Verify in browser**

Refresh dashboard. 
Expected: four stat cards now visible (Documents, Agents, API Usage, Storage). Agents card shows count and links to `/agents`. Quick Actions has a new **Create Agent** button that goes to `/agents/new`. The sidebar shows **Agents** between **Documents** and **Reports**; active highlight works when on `/agents` or `/agents/*`.

- [ ] **Step 11.5: Commit**

```bash
git add src/components/layout/AppSidebar.tsx src/components/layout/MobileSidebar.tsx src/app/dashboard/page.tsx
git commit -m "feat(agents): surface agents in sidebar and dashboard

Adds Agents nav entry (Bolt icon) to desktop + mobile sidebars, an
Agents stat card on the dashboard, and a Create Agent quick action."
```

---

## Task 12: Docs + final end-to-end smoke test

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 12.1: Update `CLAUDE.md` to document the 3rd backend URL**

In the "2-URL API Configuration" section, rename to "3-URL API Configuration" and add the Agent API bullet:

```markdown
### 3-URL API Configuration
- **Main API** (`NEXT_PUBLIC_API_URL` - port 8000): Auth, documents, folders, users, parsing
- **AI API** (`NEXT_PUBLIC_AI_API_URL` - port 8001): Summaries, FAQs, questions, RAG chat, ingestion, bulk upload, insights, usage tracking
- **Agent API** (`NEXT_PUBLIC_AGENT_API_URL` - port 8010): Agent definitions, templates, versions, dry-runs, runs
```

In the Environment Configuration `.env.local` example, add:

```env
NEXT_PUBLIC_AGENT_API_URL=http://127.0.0.1:8010
```

Under "Key Directories", add inside `src/components/`:

```
│   ├── agents/            # Agent builder UI
```

Under "Key Hooks", append the new hook lines:

```markdown
| `useAgents()` | List org agents |
| `useAgent(id)` | Get agent + CRUD mutations |
| `useRunsForAgent(id)` | Client-filtered agent runs |
| `useDryRun(id)` | Dry-run mutation returning compiled graph + output |
```

Under "Routes → Protected Routes", add:

```markdown
- `/agents` - Agent list
- `/agents/new` - Create agent wizard
- `/agents/[agentId]` - Agent detail (Overview / Graph / Runs tabs)
- `/agents/[agentId]/test` - Dry-run playground
```

Under "API Endpoints Reference", add a new section:

```markdown
### Agent API (port 8010)
- `GET /api/v1/templates/` - List template ids
- `POST /api/v1/agents/` - Create agent definition
- `GET /api/v1/agents/` - List agents (org-scoped)
- `GET/PATCH/DELETE /api/v1/agents/{id}` - Manage agent
- `POST /api/v1/agents/{id}/publish` - Publish a version
- `POST /api/v1/agents/{id}/dry-run` - Compile + run on draft
- `POST /api/v1/runs/{agentId}` - Create real run
- `GET /api/v1/runs/` - List runs (org-wide; filter client-side)
```

- [ ] **Step 12.2: Run the full type/lint checks**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no new errors.

- [ ] **Step 12.3: Full end-to-end smoke test**

With dev server + all three backends running:

1. Log in.
2. Dashboard: confirm Agents stat card (count = 0) and sidebar entry are present.
3. Click **Agents** → `/agents` empty state renders.
4. Click **New Agent** → walk through Basics / Mode / Template. Pick `summarize_documents`. Submit.
5. Redirected to `/agents/[id]`. Header shows name, mode=workflow, status=draft. **Run** button absent.
6. Overview tab: metadata, template card, "Not published yet".
7. Graph tab: 5-node pipeline visualization appears.
8. Runs tab: empty state.
9. Click **Dry Run** in header → `/agents/[id]/test`. Click **Dry run**. Output JSON + graph appear.
10. Back to detail. Click **Publish** → enter notes "first version" → submit. Status flips to `published`. **Run** button appears.
11. Click **Run** → submit default input. Toast: "Run completed". Runs tab now lists the run.
12. Click the run row → drawer shows input/output JSON.
13. Return to `/agents`. Table shows the agent with status=published. Delete it via the trash icon → confirm → agent removed.
14. Dashboard Agents stat card now shows 0 again.

- [ ] **Step 12.4: Commit docs**

```bash
git add CLAUDE.md
git commit -m "docs(agents): update CLAUDE.md with 3-URL pattern and agent routes"
```

- [ ] **Step 12.5: Push the feature branch and open a PR**

```bash
git push -u origin HEAD
gh pr create --title "Add Agent Builder UI (MVP)" --body "$(cat <<'EOF'
## Summary
- New /agents section: list, create wizard, detail (Overview/Graph/Runs), dry-run playground
- Third backend client + Next.js proxy for the agent builder API on :8010
- Dashboard stat card + sidebar entry
- Read-only @xyflow/react graph preview
- Matches current backend reality (template-picker; no per-node config)

## Test plan
- [x] Typecheck + lint clean
- [x] End-to-end: create → publish → run → view runs (see plan step 12.3)
- [ ] Reviewer spot-check: sidebar/dashboard integration

See: docs/superpowers/specs/2026-04-19-agent-builder-ui-design.md
See: docs/superpowers/plans/2026-04-19-agent-builder-ui.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review

**Spec coverage:**
- Section 4 (Navigation & routes) → Tasks 6, 7, 8, 10, 11.
- Section 5 (Pages) → Tasks 6, 7, 8, 9, 10.
- Section 6 (Components) → Tasks 5, 6, 7, 8, 9, 10.
- Section 7 (API layer) → Task 3 + Task 2 (proxy).
- Section 8 (Hooks) → Task 4.
- Section 9 (Dependencies) → Task 5.1.
- Section 10 (Env & scripts) → Task 1.
- Section 11 (Error handling) → covered inline per component (toasts, inline errors, empty states).
- Section 12 (Open questions) → JSON editor (Task 5), client-side run filter (Task 4), template copy (Task 3).
- Section 14 (Deliverable) → single PR via Task 12.5.

**Placeholder scan:** Every step has real code or real commands. The Task 8 RunsList intermediate is a trivially-working placeholder (not a TBD) that gets replaced in Task 9 — this is intentional so each task produces a working build.

**Type consistency:** `AGENT_QUERY_KEYS` defined in `useTemplates.ts` (alongside the first hook) and reused everywhere. `AgentDefinition`/`AgentVersion`/`AgentRun`/`GraphSpec` names match between types, API modules, hooks, and components. `draft_payload.goal.agent_type` is the contract — used to create agents (Task 3 `toDraftPayload`) and to read them back (Task 8 `extractTemplateId`).

**Known follow-ups (not blocking MVP):**
- Agent backend has no auth beyond the org header — matches the local-dev posture; document this risk in the PR description.
- Template descriptions live on the frontend; moving them backend-side is a small later PR.

---

Plan complete and saved to `docs/superpowers/plans/2026-04-19-agent-builder-ui.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — I execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
