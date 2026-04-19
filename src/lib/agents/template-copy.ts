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
