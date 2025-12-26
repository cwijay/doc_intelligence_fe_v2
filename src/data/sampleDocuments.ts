import { Document } from '@/types/api';

/**
 * Sample Document Data for Reference
 * 
 * This file contains sample document structures that demonstrate:
 * - Different file types (PDF, JPG, Excel)
 * - Various processing statuses (processed, processing, error)
 * - AI extraction data examples
 * - Document metadata and organization structure
 * 
 * Use this as a reference when integrating with real document APIs.
 */

export const sampleDocuments: Document[] = [
  {
    id: '1',
    name: 'Invoice_2024_001.pdf',
    type: 'application/pdf',
    size: 245760, // ~240 KB
    status: 'processed',
    uploaded_at: '2024-01-15T10:30:00Z',
    extracted_data: {
      type: 'invoice',
      amount: '$2,450.00',
      confidence: 98.5,
      // Additional invoice-specific fields
      invoice_number: 'INV-2024-001',
      vendor: 'Tech Solutions Inc.',
      due_date: '2024-02-15',
      line_items: [
        { description: 'Software License', amount: '$2,000.00' },
        { description: 'Support Services', amount: '$450.00' }
      ]
    },
    organization_id: 'Tech Startup Inc.',
    tags: ['invoice', 'finance'],
    processed_at: '2024-01-15T10:32:15Z',
    created_by: 'user-123'
  },
  {
    id: '2',
    name: 'Contract_ServiceAgreement.pdf',
    type: 'application/pdf',
    size: 1048576, // 1 MB
    status: 'processing',
    uploaded_at: '2024-01-15T09:15:00Z',
    extracted_data: null, // Still processing
    organization_id: 'Legal Corp',
    tags: ['contract', 'legal'],
    created_by: 'user-456'
  },
  {
    id: '3',
    name: 'Receipt_Office_Supplies.jpg',
    type: 'image/jpeg',
    size: 512000, // ~500 KB
    status: 'processed',
    uploaded_at: '2024-01-14T16:45:00Z',
    extracted_data: {
      type: 'receipt',
      amount: '$89.99',
      confidence: 95.2,
      // Additional receipt-specific fields
      merchant: 'Office Depot',
      date: '2024-01-14',
      items: [
        { description: 'Pens (Pack of 12)', amount: '$24.99' },
        { description: 'Paper Reams (5)', amount: '$45.00' },
        { description: 'Stapler', amount: '$20.00' }
      ],
      payment_method: 'Credit Card'
    },
    organization_id: 'Small Business LLC',
    tags: ['receipt', 'supplies'],
    processed_at: '2024-01-14T16:47:22Z',
    created_by: 'user-789'
  },
  {
    id: '4',
    name: 'Financial_Report_Q1.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 2097152, // 2 MB
    status: 'error',
    uploaded_at: '2024-01-14T14:20:00Z',
    extracted_data: null,
    organization_id: 'Analytics Co.',
    tags: ['report', 'finance'],
    error: 'Unsupported file format for text extraction. Excel files require manual processing.',
    created_by: 'user-101'
  }
];

/**
 * Sample Document Statistics
 * Example of what document statistics might look like
 */
export const sampleDocumentStats = {
  total_documents: 4,
  by_status: {
    uploaded: 0,
    processing: 1,
    processed: 2,
    error: 1,
    failed: 0
  },
  total_size: 3897088, // Total bytes of all documents
  processing_queue: 1,
  recent_uploads: 4,
  most_common_types: [
    { type: 'application/pdf', count: 2 },
    { type: 'image/jpeg', count: 1 },
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', count: 1 }
  ]
};

/**
 * Utility Functions for Document Processing
 * These can be moved to utils if needed for real implementation
 */

export const getFileTypeIcon = (type: string): string => {
  if (!type) return '📄';
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📄';
  if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📊';
  return '📄';
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'processed': return 'text-success-600 bg-success-100';
    case 'processing': return 'text-warning-600 bg-warning-100';
    case 'error':
    case 'failed': return 'text-error-600 bg-error-100';
    case 'uploaded': return 'text-info-600 bg-info-100';
    default: return 'text-secondary-600 bg-secondary-100';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};