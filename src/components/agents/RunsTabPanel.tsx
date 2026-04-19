'use client';

import type { AgentDefinition } from '@/types/agents';
import RunsList from './RunsList';

interface Props {
  agent: AgentDefinition;
}

export default function RunsTabPanel({ agent }: Props) {
  return <RunsList agentId={agent.id} />;
}
