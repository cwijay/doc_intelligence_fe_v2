import { Document } from '@/types/api';
import {
  constructParsedPath,
  getBaseName,
  type PathParams,
} from '@/lib/gcs-paths';

/**
 * Utility functions for constructing paths required by the Enhanced RAG API
 * Handles dynamic path construction for document_paths and bm_25_paths
 *
 * NOTE: For new code, prefer using the centralized utilities in '@/lib/gcs-paths'.
 * This module provides backwards compatibility and RAG-specific helpers.
 */

/**
 * Extract filename without extension from document name
 * Example: "report.pdf" -> "report", "data.xlsx" -> "data"
 *
 * @deprecated Use getBaseName from '@/lib/gcs-paths' instead
 */
export const getDocumentNameWithoutExtension = (documentName: string): string => {
  return getBaseName(documentName);
};

/**
 * Construct document path for parsed content in GCS
 * Format: {org_name}/parsed/{folder_name}/{document_name}.md
 *
 * @deprecated Use constructParsedPath from '@/lib/gcs-paths' instead
 */
export const constructDocumentPath = (
  orgName: string,
  folderName: string,
  documentName: string
): string => {
  const params: PathParams = { orgName, folderName, documentName };
  return constructParsedPath(params);
};

/**
 * Construct BM25 index path for keyword search
 * Format: {org_name}/bm-25/{folder_name}/{document_name}.pkl
 *
 * NOTE: BM25 paths are handled separately and not part of the centralized utility.
 */
export const constructBM25Path = (
  orgName: string,
  folderName: string,
  documentName: string
): string => {
  const nameWithoutExtension = getBaseName(documentName);
  return `${orgName}/bm-25/${folderName}/${nameWithoutExtension}.pkl`;
};

/**
 * Enhanced interface for document with folder information
 * Required for path construction
 */
export interface DocumentWithFolder extends Document {
  folder_name?: string; // Resolved folder name (not ID)
}

/**
 * Construct paths for multiple documents
 * Returns both document_paths and bm_25_paths arrays for Enhanced RAG API
 */
export const constructMultiDocumentPaths = (
  orgName: string,
  documents: DocumentWithFolder[]
): {
  document_paths: string[];
  document_name_list: string[];
  bm_25_paths: string[];
} => {
  const document_paths: string[] = [];
  const document_name_list: string[] = [];
  const bm_25_paths: string[] = [];

  for (const doc of documents) {
    if (!doc.folder_name) {
      console.warn('⚠️ Document missing folder_name, skipping:', doc.name);
      continue;
    }

    // Document path for parsed content
    document_paths.push(constructDocumentPath(orgName, doc.folder_name, doc.name));
    
    // Document name with extension for filtering (matches Pinecone metadata)
    document_name_list.push(doc.name);
    
    // BM25 path for keyword search index
    bm_25_paths.push(constructBM25Path(orgName, doc.folder_name, doc.name));
  }

  console.log('🛤️ Constructed Enhanced RAG paths:', {
    orgName,
    documentCount: documents.length,
    document_paths,
    document_name_list,
    bm_25_paths,
  });

  return {
    document_paths,
    document_name_list,
    bm_25_paths,
  };
};

/**
 * Validate that all required path components are available
 * Returns validation result and missing components
 */
export const validatePathComponents = (
  orgName: string,
  documents: DocumentWithFolder[]
): {
  isValid: boolean;
  missingComponents: string[];
  validDocuments: DocumentWithFolder[];
} => {
  const missingComponents: string[] = [];
  const validDocuments: DocumentWithFolder[] = [];

  if (!orgName) {
    missingComponents.push('organization name');
  }

  if (!documents || documents.length === 0) {
    missingComponents.push('documents array');
  }

  // Check each document for required components
  for (const doc of documents) {
    if (!doc.name) {
      missingComponents.push(`document name for doc ID: ${doc.id}`);
      continue;
    }
    if (!doc.folder_name) {
      missingComponents.push(`folder name for document: ${doc.name}`);
      continue;
    }
    validDocuments.push(doc);
  }

  const isValid = missingComponents.length === 0 && validDocuments.length > 0;

  return {
    isValid,
    missingComponents,
    validDocuments,
  };
};

/**
 * Helper to clean folder name for path construction
 * Removes special characters and normalizes naming
 */
export const cleanFolderName = (folderName: string): string => {
  return folderName
    .replace(/[^a-zA-Z0-9-_\s]/g, '') // Remove special chars except hyphens, underscores, spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase()
    .trim();
};

/**
 * Debug utility to log all constructed paths
 */
export const debugLogPaths = (
  orgName: string,
  documents: DocumentWithFolder[],
  paths: {
    document_paths: string[];
    document_name_list: string[];
    bm_25_paths: string[];
  }
): void => {
  console.group('🛤️ Enhanced RAG Path Construction Debug');
  
  console.log('📋 Input Parameters:', {
    orgName,
    documentCount: documents.length,
    documents: documents.map(d => ({
      name: d.name,
      folder_name: d.folder_name,
    })),
  });

  console.log('📄 Generated document_paths:');
  paths.document_paths.forEach((path, index) => {
    console.log(`  ${index + 1}. ${path}`);
  });

  console.log('📝 Generated document_name_list:');
  paths.document_name_list.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });

  console.log('🔍 Generated bm_25_paths:');
  paths.bm_25_paths.forEach((path, index) => {
    console.log(`  ${index + 1}. ${path}`);
  });

  console.groupEnd();
};