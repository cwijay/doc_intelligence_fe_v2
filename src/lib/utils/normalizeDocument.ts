import { Document } from '@/types/api';

/**
 * Normalize document fields from various backend response formats.
 * Handles field name mismatches between different API endpoints.
 *
 * This utility consolidates document normalization logic that was previously
 * duplicated across useDocuments.ts and useFolders.ts hooks.
 */
export const normalizeDocument = (doc: any): Document => {
  // Handle field name mismatches
  const documentName = doc.name || doc.filename || doc.file_name || '';
  const documentType = doc.type || doc.file_type || doc.content_type || '';

  // Extract filename from path if name is missing
  let finalName = documentName;
  if (!finalName && doc.path) {
    finalName = doc.path.split('/').pop() || '';
  }
  if (!finalName && doc.gcs_path) {
    finalName = doc.gcs_path.split('/').pop() || '';
  }

  // Extract file extension for type if type is missing
  let finalType = documentType;
  if (!finalType && finalName) {
    const extension = finalName.split('.').pop()?.toLowerCase();
    finalType = extension || '';
  }

  // Handle size field with multiple possible field names and type conversion
  let documentSize = 0;
  const sizeFields = [
    doc.size,
    doc.file_size,
    doc.filesize,
    doc.content_length,
    doc.length,
    doc.bytes,
    doc.size_bytes
  ];

  for (const sizeField of sizeFields) {
    if (sizeField != null) {
      // Convert to number if it's a string
      const numericSize = typeof sizeField === 'string' ? parseInt(sizeField, 10) : sizeField;
      if (!isNaN(numericSize) && numericSize > 0) {
        documentSize = numericSize;
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Found size for ${finalName}: ${documentSize} bytes`);
        }
        break;
      }
    }
  }

  if (documentSize === 0 && process.env.NODE_ENV === 'development') {
    console.log(`⚠️ No valid size found for document: ${finalName}`);
  }

  return {
    id: doc.id || doc.document_id || `temp-${Date.now()}`,
    name: finalName || 'Unknown File',
    type: finalType || 'unknown',
    size: documentSize,
    status: doc.status || 'uploaded',
    uploaded_at: doc.uploaded_at || doc.created_at || new Date().toISOString(),
    extracted_data: doc.extracted_data || null,
    organization_id: doc.organization_id || doc.org_id || '',
    tags: doc.tags || [],
    error: doc.error ? (typeof doc.error === 'string' ? doc.error : String(doc.error)) : undefined,
    folder_id: doc.folder_id || undefined,
    processed_at: doc.processed_at || undefined,
    created_by: doc.created_by || undefined,
  };
};
