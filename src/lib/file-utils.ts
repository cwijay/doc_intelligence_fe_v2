import { Document } from '@/types/api';
import { formatFileSize } from './file-types';

// Excel and CSV file extensions
export const EXCEL_FILE_EXTENSIONS = ['.xlsx', '.xls'] as const;
export const CSV_FILE_EXTENSIONS = ['.csv'] as const;
export const SPREADSHEET_FILE_EXTENSIONS = [...EXCEL_FILE_EXTENSIONS, ...CSV_FILE_EXTENSIONS] as const;

// MIME types for Excel and CSV files
export const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/msexcel',
  'application/x-excel',
  'application/x-msexcel',
] as const;

export const CSV_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'text/comma-separated-values',
] as const;

export const SPREADSHEET_MIME_TYPES = [...EXCEL_MIME_TYPES, ...CSV_MIME_TYPES] as const;

// File type detection functions
export const isExcelFile = (document: Document): boolean => {
  // Add defensive checks
  if (!document) {
    console.warn('⚠️ isExcelFile: document is null or undefined');
    return false;
  }
  
  if (!document.name || !document.type) {
    console.warn('⚠️ isExcelFile: document missing name or type:', { name: document.name, type: document.type });
    return false;
  }
  
  const fileName = document.name.toLowerCase();
  const fileType = document.type.toLowerCase();
  
  // Check by file extension
  const hasExcelExtension = EXCEL_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  // Check by MIME type
  const hasExcelMimeType = EXCEL_MIME_TYPES.some(mime => fileType.includes(mime.toLowerCase()));
  
  // Check by simple type matching
  const hasExcelType = ['xlsx', 'xls', 'excel'].some(type => fileType.includes(type));
  
  return hasExcelExtension || hasExcelMimeType || hasExcelType;
};

export const isCsvFile = (document: Document): boolean => {
  // Add defensive checks
  if (!document) {
    console.warn('⚠️ isCsvFile: document is null or undefined');
    return false;
  }
  
  if (!document.name || !document.type) {
    console.warn('⚠️ isCsvFile: document missing name or type:', { name: document.name, type: document.type });
    return false;
  }
  
  const fileName = document.name.toLowerCase();
  const fileType = document.type.toLowerCase();
  
  // Check by file extension
  const hasCsvExtension = CSV_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  // Check by MIME type
  const hasCsvMimeType = CSV_MIME_TYPES.some(mime => fileType.includes(mime.toLowerCase()));
  
  // Check by simple type matching
  const hasCsvType = fileType.includes('csv');
  
  return hasCsvExtension || hasCsvMimeType || hasCsvType;
};

export const isSpreadsheetFile = (document: Document): boolean => {
  return isExcelFile(document) || isCsvFile(document);
};

// Get specific spreadsheet type
export const getSpreadsheetType = (document: Document): 'excel' | 'csv' | null => {
  if (isExcelFile(document)) return 'excel';
  if (isCsvFile(document)) return 'csv';
  return null;
};

// Get file format for display
export const getSpreadsheetFormat = (document: Document): string => {
  const fileName = document.name.toLowerCase();
  
  if (fileName.endsWith('.xlsx')) return 'XLSX';
  if (fileName.endsWith('.xls')) return 'XLS';
  if (fileName.endsWith('.csv')) return 'CSV';
  
  // Fallback to document type
  const type = document.type.toLowerCase();
  if (type.includes('xlsx') || type.includes('openxml')) return 'XLSX';
  if (type.includes('xls') || type.includes('ms-excel')) return 'XLS';
  if (type.includes('csv')) return 'CSV';
  
  return 'Unknown';
};

// Validate multiple documents for Excel chat (setup-safe version)
export const validateSpreadsheetDocuments = (documents: Document[]): {
  valid: Document[];
  invalid: Document[];
  errors: string[];
} => {
  const valid: Document[] = [];
  const invalid: Document[] = [];
  const errors: string[] = [];
  
  try {
    // Handle null, undefined, or non-array inputs
    if (!documents) {
      console.warn('⚠️ validateSpreadsheetDocuments: documents parameter is null or undefined');
      errors.push('No documents provided');
      return { valid, invalid, errors };
    }
    
    if (!Array.isArray(documents)) {
      console.warn('⚠️ validateSpreadsheetDocuments: documents parameter is not an array:', typeof documents, documents);
      errors.push('Invalid documents format - expected array');
      return { valid, invalid, errors };
    }
    
    if (!documents.length) {
      console.warn('⚠️ validateSpreadsheetDocuments: empty documents array provided');
      errors.push('At least one document is required');
      return { valid, invalid, errors };
    }
  } catch (error) {
    console.error('🚨 validateSpreadsheetDocuments: Unexpected error during validation:', error);
    errors.push('Validation error occurred');
    return { valid, invalid, errors };
  }
  
  if (documents.length > 10) {
    errors.push('Maximum 10 files allowed for optimal performance');
  }
  
  documents.forEach(doc => {
    if (isSpreadsheetFile(doc)) {
      valid.push(doc);
    } else {
      invalid.push(doc);
      errors.push(`"${doc.name}" is not a supported spreadsheet file (Excel or CSV)`);
    }
  });
  
  return { valid, invalid, errors };
};

// Re-export formatFileSize from file-types for backward compatibility
export { formatFileSize };

// Get file type icon emoji based on MIME type
export const getFileTypeIcon = (type: string): string => {
  if (!type) return '📄';
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📄';
  if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📊';
  return '📄';
};

// Get appropriate icon class for spreadsheet files
export const getSpreadsheetIconClass = (document: Document): string => {
  if (isExcelFile(document)) {
    return 'text-green-600'; // Excel green
  }
  if (isCsvFile(document)) {
    return 'text-blue-600'; // CSV blue
  }
  return 'text-secondary-600'; // Default
};

// Get file type display name
export const getFileTypeDisplayName = (document: Document): string => {
  const format = getSpreadsheetFormat(document);
  const type = getSpreadsheetType(document);
  
  if (type === 'excel') {
    return `Excel Spreadsheet (${format})`;
  }
  if (type === 'csv') {
    return 'CSV File';
  }
  
  return 'Spreadsheet File';
};

// Check if document supports Excel chat
export const supportsExcelChat = (document: Document): boolean => {
  return isSpreadsheetFile(document);
};

// Helper to get all spreadsheet documents from a list
export const filterSpreadsheetDocuments = (documents: Document[]): Document[] => {
  return documents.filter(isSpreadsheetFile);
};

// Export file utilities
export const fileUtils = {
  // Type detection
  isExcelFile,
  isCsvFile,
  isSpreadsheetFile,
  supportsExcelChat,

  // Type information
  getSpreadsheetType,
  getSpreadsheetFormat,
  getFileTypeDisplayName,
  getSpreadsheetIconClass,
  getFileTypeIcon,

  // Validation
  validateSpreadsheetDocuments,
  filterSpreadsheetDocuments,

  // Utilities
  formatFileSize,

  // Constants
  EXCEL_FILE_EXTENSIONS,
  CSV_FILE_EXTENSIONS,
  SPREADSHEET_FILE_EXTENSIONS,
  EXCEL_MIME_TYPES,
  CSV_MIME_TYPES,
  SPREADSHEET_MIME_TYPES,
};

export default fileUtils;