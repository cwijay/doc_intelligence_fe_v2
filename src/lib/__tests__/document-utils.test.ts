import { isDocumentParsed, canPerformAIOperations, getDocumentParseStatusMessage } from '../document-utils';
import { Document } from '@/types/api';

describe('document-utils', () => {
  const baseMockDocument: Document = {
    id: '1',
    name: 'test.pdf',
    type: 'pdf',
    size: 1000,
    status: 'uploaded',
    uploaded_at: '2023-01-01T00:00:00Z',
    organization_id: 'org1',
    tags: []
  };

  describe('isDocumentParsed', () => {
    it('should return false for unparsed document', () => {
      const document = { ...baseMockDocument };
      expect(isDocumentParsed(document)).toBe(false);
    });

    it('should return true if document has parsed_content', () => {
      const document = { 
        ...baseMockDocument, 
        parsed_content: 'This is parsed text' 
      };
      expect(isDocumentParsed(document)).toBe(true);
    });

    it('should return true if document has parsed_content_path', () => {
      const document = { 
        ...baseMockDocument, 
        parsed_content_path: '/path/to/parsed/content.md' 
      };
      expect(isDocumentParsed(document)).toBe(true);
    });

    it('should return true if document has parsed_at timestamp', () => {
      const document = { 
        ...baseMockDocument, 
        parsed_at: '2023-01-01T12:00:00Z' 
      };
      expect(isDocumentParsed(document)).toBe(true);
    });

    it('should return true if document has multiple parse indicators', () => {
      const document = { 
        ...baseMockDocument, 
        parsed_content: 'Content',
        parsed_content_path: '/path/to/content.md',
        parsed_at: '2023-01-01T12:00:00Z' 
      };
      expect(isDocumentParsed(document)).toBe(true);
    });
  });

  describe('canPerformAIOperations', () => {
    it('should return false for unparsed document', () => {
      const document = { ...baseMockDocument };
      expect(canPerformAIOperations(document)).toBe(false);
    });

    it('should return true for parsed document', () => {
      const document = { 
        ...baseMockDocument, 
        parsed_content: 'This is parsed text' 
      };
      expect(canPerformAIOperations(document)).toBe(true);
    });
  });

  describe('getDocumentParseStatusMessage', () => {
    it('should return null for parsed document', () => {
      const document = { 
        ...baseMockDocument, 
        parsed_content: 'This is parsed text' 
      };
      expect(getDocumentParseStatusMessage(document)).toBe(null);
    });

    it('should return helpful message for unparsed document', () => {
      const document = { ...baseMockDocument };
      const message = getDocumentParseStatusMessage(document);
      expect(message).toContain('Document must be parsed first');
      expect(message).toContain('parse button');
    });
  });
});