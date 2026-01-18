/**
 * Template Matcher Utility
 * Provides semantic matching between folder names and template document types
 */

import { TemplateInfo } from '@/types/extraction';

/**
 * Normalize a string for matching:
 * - Lowercase
 * - Replace hyphens with underscores
 * - Remove trailing 's' for pluralization
 * - Trim whitespace
 */
function normalizeForMatching(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/-/g, '_')
    .replace(/s$/, ''); // Remove trailing 's' for plural forms
}

/**
 * Common folder name to document type mappings
 * Maps normalized folder names to their corresponding document types
 */
const FOLDER_TO_TYPE_MAPPINGS: Record<string, string[]> = {
  invoice: ['invoice'],
  purchase_order: ['purchase_order'],
  receipt: ['receipt'],
  contract: ['contract'],
  bill_of_lading: ['bill_of_lading'],
  packing_list: ['packing_list'],
  quotation: ['quotation', 'quote'],
  quality_report: ['quality_report'],
  delivery_note: ['delivery_note'],
  statement: ['statement'],
  credit_note: ['credit_note'],
  debit_note: ['debit_note'],
  remittance: ['remittance'],
  payment: ['payment'],
  order: ['order', 'purchase_order'],
  report: ['report', 'quality_report'],
};

/**
 * Get possible document types for a folder name
 * Uses semantic matching to find related document types
 */
export function matchFolderToTemplateTypes(folderName: string): string[] {
  const normalized = normalizeForMatching(folderName);

  // Check direct mapping first
  if (FOLDER_TO_TYPE_MAPPINGS[normalized]) {
    return FOLDER_TO_TYPE_MAPPINGS[normalized];
  }

  // Check if folder contains any known type keywords
  const matchedTypes: string[] = [];
  for (const [key, types] of Object.entries(FOLDER_TO_TYPE_MAPPINGS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      matchedTypes.push(...types);
    }
  }

  // If still no matches, return the normalized folder name as a potential type
  if (matchedTypes.length === 0) {
    return [normalized];
  }

  // Remove duplicates
  return [...new Set(matchedTypes)];
}

/**
 * Calculate match score between folder name and template document type
 * Higher score = better match
 */
function calculateMatchScore(folderName: string, documentType: string): number {
  const normalizedFolder = normalizeForMatching(folderName);
  const normalizedType = normalizeForMatching(documentType);

  // Exact match after normalization
  if (normalizedFolder === normalizedType) {
    return 100;
  }

  // Folder contains type or vice versa
  if (normalizedFolder.includes(normalizedType)) {
    return 80;
  }
  if (normalizedType.includes(normalizedFolder)) {
    return 70;
  }

  // Check mapped types
  const mappedTypes = matchFolderToTemplateTypes(folderName);
  if (mappedTypes.includes(normalizedType)) {
    return 90;
  }

  // Partial word match (e.g., 'inv' matches 'invoice')
  const folderWords = normalizedFolder.split('_');
  const typeWords = normalizedType.split('_');

  let wordMatchCount = 0;
  for (const folderWord of folderWords) {
    for (const typeWord of typeWords) {
      if (folderWord.startsWith(typeWord) || typeWord.startsWith(folderWord)) {
        wordMatchCount++;
      }
    }
  }

  if (wordMatchCount > 0) {
    return 50 + (wordMatchCount * 10);
  }

  return 0;
}

/**
 * Filter templates by folder name using semantic matching
 * Returns templates sorted by relevance (best matches first)
 */
export function filterTemplatesByFolder(
  templates: TemplateInfo[],
  folderName: string
): TemplateInfo[] {
  if (!folderName || !templates || templates.length === 0) {
    return [];
  }

  // Calculate match scores and filter
  const scoredTemplates = templates
    .map(template => ({
      template,
      score: calculateMatchScore(folderName, template.document_type),
    }))
    .filter(({ score }) => score > 0) // Only include matches
    .sort((a, b) => b.score - a.score); // Sort by score descending

  return scoredTemplates.map(({ template }) => template);
}

/**
 * Check if a folder has any matching templates
 */
export function hasMatchingTemplates(
  templates: TemplateInfo[],
  folderName: string
): boolean {
  return filterTemplatesByFolder(templates, folderName).length > 0;
}

/**
 * Get the best matching template for a folder
 * Returns null if no good match exists
 */
export function getBestMatchingTemplate(
  templates: TemplateInfo[],
  folderName: string
): TemplateInfo | null {
  const matches = filterTemplatesByFolder(templates, folderName);
  return matches.length > 0 ? matches[0] : null;
}
