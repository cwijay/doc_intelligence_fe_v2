'use client';

interface Props {
  agentId: string;
}

export default function RunsList({ agentId: _agentId }: Props) {
  return (
    <div className="p-6 rounded-lg border border-dashed border-secondary-300 dark:border-secondary-700 text-sm text-secondary-500 dark:text-secondary-400 text-center">
      Runs list coming in the next task.
    </div>
  );
}
