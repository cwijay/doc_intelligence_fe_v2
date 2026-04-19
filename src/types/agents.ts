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
  templateId: string;
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
}

// ----- Templates -----

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
