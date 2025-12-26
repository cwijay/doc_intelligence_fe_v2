'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useEffect, useCallback, useMemo } from 'react';
import { marked } from 'marked';
import {
  TableCellsIcon,
  PlusIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

// Configure marked for GFM (GitHub Flavored Markdown)
marked.setOptions({
  gfm: true,
  breaks: true,
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  editable?: boolean;
}

// Helper function to detect if content is already HTML
function isHtml(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('<') && (
    trimmed.startsWith('<p') ||
    trimmed.startsWith('<div') ||
    trimmed.startsWith('<h') ||
    trimmed.startsWith('<table') ||
    trimmed.startsWith('<ul') ||
    trimmed.startsWith('<ol') ||
    trimmed.startsWith('<!') ||
    trimmed.startsWith('<br')
  );
}

// Convert markdown to HTML
function convertToHtml(content: string): string {
  if (!content || content.trim() === '') return '';

  // If already HTML, return as-is
  if (isHtml(content)) {
    return content;
  }

  // Convert markdown to HTML
  const html = marked.parse(content);
  return typeof html === 'string' ? html : '';
}

export default function RichTextEditor({
  content,
  onChange,
  className,
  editable = true,
}: RichTextEditorProps) {
  // Convert markdown content to HTML for the editor
  const htmlContent = useMemo(() => convertToHtml(content), [content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable some features we don't need
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'editor-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: htmlContent,
    editable: editable,
    immediatelyRender: false, // Required for SSR/Next.js to avoid hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && htmlContent !== editor.getHTML()) {
      editor.commands.setContent(htmlContent);
    }
  }, [htmlContent, editor]);

  // Table operations
  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addColumnBefore = useCallback(() => {
    editor?.chain().focus().addColumnBefore().run();
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    editor?.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteColumn = useCallback(() => {
    editor?.chain().focus().deleteColumn().run();
  }, [editor]);

  const addRowBefore = useCallback(() => {
    editor?.chain().focus().addRowBefore().run();
  }, [editor]);

  const addRowAfter = useCallback(() => {
    editor?.chain().focus().addRowAfter().run();
  }, [editor]);

  const deleteRow = useCallback(() => {
    editor?.chain().focus().deleteRow().run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    editor?.chain().focus().deleteTable().run();
  }, [editor]);

  const mergeCells = useCallback(() => {
    editor?.chain().focus().mergeCells().run();
  }, [editor]);

  const splitCell = useCallback(() => {
    editor?.chain().focus().splitCell().run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-secondary-50">
        <div className="animate-pulse text-secondary-500">Loading editor...</div>
      </div>
    );
  }

  const isInTable = editor.isActive('table');

  return (
    <div className={clsx('rich-text-editor border border-secondary-200 rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-secondary-50 border-b border-secondary-200 flex-wrap">
        {/* Table insert button */}
        <button
          onClick={insertTable}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-secondary-700 bg-white border border-secondary-200 rounded-md hover:bg-secondary-100 transition-colors"
          title="Insert Table"
        >
          <TableCellsIcon className="w-4 h-4" />
          <span>Insert Table</span>
        </button>

        {/* Table editing buttons - only show when cursor is in a table */}
        {isInTable && (
          <>
            <div className="w-px h-6 bg-secondary-300 mx-1" />

            {/* Column operations */}
            <div className="flex items-center gap-0.5">
              <span className="text-xs text-secondary-500 mr-1">Cols:</span>
              <button
                onClick={addColumnBefore}
                className="p-1.5 text-secondary-600 hover:bg-secondary-100 rounded transition-colors"
                title="Add Column Before"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={addColumnAfter}
                className="p-1.5 text-secondary-600 hover:bg-secondary-100 rounded transition-colors"
                title="Add Column After"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={deleteColumn}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete Column"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-secondary-300 mx-1" />

            {/* Row operations */}
            <div className="flex items-center gap-0.5">
              <span className="text-xs text-secondary-500 mr-1">Rows:</span>
              <button
                onClick={addRowBefore}
                className="p-1.5 text-secondary-600 hover:bg-secondary-100 rounded transition-colors"
                title="Add Row Before"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={addRowAfter}
                className="p-1.5 text-secondary-600 hover:bg-secondary-100 rounded transition-colors"
                title="Add Row After"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={deleteRow}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete Row"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-secondary-300 mx-1" />

            {/* Cell operations */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={mergeCells}
                className="flex items-center gap-1 px-2 py-1 text-xs text-secondary-600 hover:bg-secondary-100 rounded transition-colors"
                title="Merge Cells"
              >
                <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
                Merge
              </button>
              <button
                onClick={splitCell}
                className="flex items-center gap-1 px-2 py-1 text-xs text-secondary-600 hover:bg-secondary-100 rounded transition-colors"
                title="Split Cell"
              >
                Split
              </button>
            </div>

            <div className="w-px h-6 bg-secondary-300 mx-1" />

            {/* Delete table */}
            <button
              onClick={deleteTable}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete Table"
            >
              Delete Table
            </button>
          </>
        )}
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
