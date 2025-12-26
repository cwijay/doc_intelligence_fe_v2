'use client';

import { Document } from '@/types/api';
import { foldersApi } from '@/lib/api/index';

/**
 * Helper to resolve folder name from document's folder_id
 */
export async function resolveFolderName(
  document: Document,
  orgId: string
): Promise<string> {
  // Try to use folder_name if already on the document
  if (document.folder_name) {
    return document.folder_name;
  }

  // Resolve folder name from folder_id
  if (document.folder_id && orgId) {
    try {
      const folder = await foldersApi.getById(orgId, document.folder_id);
      return folder.name;
    } catch (error) {
      console.warn('Could not resolve folder name:', error);
    }
  }

  // Fallback to 'default' if no folder
  return 'default';
}
