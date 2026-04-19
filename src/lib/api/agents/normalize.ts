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
  nodes: (w.nodes ?? []).map((n) => ({ id: n.id, nodeType: n.node_type, config: n.config })),
  edges: (w.edges ?? []).map((e) => ({ source: e.source, target: e.target })),
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
  status: w.status,
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
