/**
 * Utility functions for document content metadata
 */

interface ExtractedMetadata {
  prepared_by?: string;
  date?: string;
  lot_number?: string;
  quality_control?: string;
  [key: string]: any;
}

/**
 * Merge extracted metadata with existing metadata, prioritizing extracted values
 */
export function mergeMetadata(
  existingMetadata: Record<string, any>,
  extractedMetadata: ExtractedMetadata
): Record<string, any> {
  const merged = {
    ...existingMetadata,
    ...extractedMetadata,
    content_metadata_extracted: true,
    content_metadata_updated_at: new Date().toISOString()
  };

  console.log('🔗 Merging metadata:', {
    existingKeys: Object.keys(existingMetadata),
    extractedKeys: Object.keys(extractedMetadata),
    mergedKeys: Object.keys(merged),
    prioritizedFields: Object.keys(extractedMetadata)
  });

  return merged;
}
