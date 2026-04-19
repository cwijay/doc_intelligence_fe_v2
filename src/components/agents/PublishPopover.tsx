'use client';

import { useRef, useState, useEffect } from 'react';
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

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
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        icon={<PaperAirplaneIcon className="w-4 h-4" />}
        onClick={() => setOpen((o) => !o)}
      >
        Publish
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 shadow-xl p-4 z-20">
          <label htmlFor="publish-notes" className="block text-sm font-medium mb-1 text-secondary-700 dark:text-secondary-300">Publish notes (optional)</label>
          <textarea
            id="publish-notes"
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
