/**
 * Utility functions for managing generation count preferences
 * Stores user preferences for FAQ and Questions generation counts
 */

export type GenerationType = 'faq' | 'questions';

const DEFAULT_COUNTS = {
  faq: 10,
  questions: 10
};

const MAX_COUNTS = {
  faq: 50,
  questions: 50
};

const MIN_COUNT = 1;

/**
 * Get the saved generation count for a specific type and document type
 * @param type - 'faq' or 'questions'
 * @param docType - Optional document type (e.g., 'pdf', 'docx')
 * @returns The saved count or default value
 */
export const getGenerationCount = (type: GenerationType, docType?: string): number => {
  if (typeof window === 'undefined') return DEFAULT_COUNTS[type];
  
  const key = `generation_count_${type}_${docType || 'default'}`;
  const saved = localStorage.getItem(key);
  
  if (saved) {
    const count = parseInt(saved, 10);
    if (!isNaN(count) && count >= MIN_COUNT && count <= MAX_COUNTS[type]) {
      return count;
    }
  }
  
  return DEFAULT_COUNTS[type];
};

/**
 * Save a generation count preference
 * @param type - 'faq' or 'questions'
 * @param count - The count to save
 * @param docType - Optional document type
 */
export const setGenerationCount = (type: GenerationType, count: number, docType?: string): void => {
  if (typeof window === 'undefined') return;
  
  // Validate count
  const validCount = Math.max(MIN_COUNT, Math.min(count, MAX_COUNTS[type]));
  const key = `generation_count_${type}_${docType || 'default'}`;
  
  localStorage.setItem(key, validCount.toString());
};

/**
 * Get recent generation counts (for quick selection)
 * @param type - 'faq' or 'questions'
 * @returns Array of recent unique counts
 */
export const getRecentCounts = (type: GenerationType): number[] => {
  if (typeof window === 'undefined') return [5, 10, 15, 20];
  
  const key = `recent_counts_${type}`;
  const saved = localStorage.getItem(key);
  
  if (saved) {
    try {
      const counts = JSON.parse(saved);
      if (Array.isArray(counts)) {
        return counts;
      }
    } catch {
      // Invalid data, return defaults
    }
  }
  
  return [5, 10, 15, 20];
};

/**
 * Add a count to recent counts history
 * @param type - 'faq' or 'questions'
 * @param count - The count to add
 */
export const addToRecentCounts = (type: GenerationType, count: number): void => {
  if (typeof window === 'undefined') return;
  
  const key = `recent_counts_${type}`;
  let recent = getRecentCounts(type);
  
  // Add new count if not already present
  if (!recent.includes(count)) {
    recent = [count, ...recent].slice(0, 5); // Keep only 5 most recent
    recent.sort((a, b) => a - b); // Sort ascending
    localStorage.setItem(key, JSON.stringify(recent));
  }
};

/**
 * Get the default count for a generation type
 * @param type - 'faq' or 'questions'
 * @returns The default count
 */
export const getDefaultCount = (type: GenerationType): number => {
  return DEFAULT_COUNTS[type];
};

/**
 * Get the maximum allowed count for a generation type
 * @param type - 'faq' or 'questions'
 * @returns The maximum count
 */
export const getMaxCount = (type: GenerationType): number => {
  return MAX_COUNTS[type];
};

/**
 * Validate if a count is within acceptable range
 * @param type - 'faq' or 'questions'
 * @param count - The count to validate
 * @returns True if valid, false otherwise
 */
export const isValidCount = (type: GenerationType, count: number): boolean => {
  return count >= MIN_COUNT && count <= MAX_COUNTS[type];
};

/**
 * Get recommended count range for a generation type
 * @param type - 'faq' or 'questions'
 * @returns Object with min and max recommended counts
 */
export const getRecommendedRange = (type: GenerationType): { min: number; max: number; optimal: number } => {
  if (type === 'faq') {
    return { min: 5, max: 20, optimal: 10 };
  }
  return { min: 5, max: 25, optimal: 15 };
};