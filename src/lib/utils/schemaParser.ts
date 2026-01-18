/**
 * Schema Parser Utility
 * Parses JSON Schema format to extract field definitions for preview
 */

import { TemplateField } from '@/types/extraction';

/**
 * Map JSON Schema types to display-friendly types
 */
function mapSchemaType(schemaType: string | string[] | undefined, format?: string): string {
  // Handle array of types (e.g., ['string', 'null'])
  const primaryType = Array.isArray(schemaType)
    ? schemaType.find(t => t !== 'null') || 'string'
    : schemaType || 'string';

  // Check format for more specific types
  if (format) {
    switch (format.toLowerCase()) {
      case 'date':
      case 'date-time':
        return 'date';
      case 'currency':
      case 'money':
        return 'currency';
      case 'email':
      case 'uri':
      case 'url':
        return 'string';
    }
  }

  // Map base types
  switch (primaryType.toLowerCase()) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'array';
    case 'object':
      return 'object';
    default:
      return 'string';
  }
}

/**
 * Convert field name to display name
 * Handles snake_case, camelCase, and other formats
 */
function toDisplayName(fieldName: string): string {
  return fieldName
    // Insert space before uppercase letters (for camelCase)
    .replace(/([A-Z])/g, ' $1')
    // Replace underscores and hyphens with spaces
    .replace(/[_-]/g, ' ')
    // Capitalize first letter of each word
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

type FieldLocation = 'header' | 'body' | 'footer' | 'line_item';

/**
 * Infer field location from field name or type
 */
function inferLocation(fieldName: string, dataType: string): FieldLocation {
  const lowerName = fieldName.toLowerCase();

  // Line item indicators
  if (
    dataType === 'array' ||
    lowerName.includes('line_item') ||
    lowerName.includes('items') ||
    lowerName.includes('products') ||
    lowerName.includes('services')
  ) {
    return 'line_item';
  }

  // Footer indicators (usually totals, summaries)
  if (
    lowerName.includes('total') ||
    lowerName.includes('subtotal') ||
    lowerName.includes('tax') ||
    lowerName.includes('discount') ||
    lowerName.includes('grand') ||
    lowerName.includes('balance') ||
    lowerName.includes('due') ||
    lowerName.includes('amount_due') ||
    lowerName.includes('payment')
  ) {
    return 'footer';
  }

  // Header indicators (usually identifiers, dates, parties)
  if (
    lowerName.includes('number') ||
    lowerName.includes('date') ||
    lowerName.includes('vendor') ||
    lowerName.includes('customer') ||
    lowerName.includes('company') ||
    lowerName.includes('address') ||
    lowerName.includes('name') ||
    lowerName.includes('id') ||
    lowerName.includes('reference') ||
    lowerName.includes('po_number') ||
    lowerName.includes('invoice_number')
  ) {
    return 'header';
  }

  // Default to body
  return 'body';
}

/**
 * Parse a JSON Schema object to extract field definitions
 */
export function parseSchemaToFields(schema: Record<string, unknown>): TemplateField[] {
  const fields: TemplateField[] = [];

  if (!schema || typeof schema !== 'object') {
    return fields;
  }

  // Get properties from schema
  const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
  const required = (schema.required as string[]) || [];

  if (!properties) {
    return fields;
  }

  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    if (!fieldSchema || typeof fieldSchema !== 'object') {
      continue;
    }

    const schemaType = fieldSchema.type as string | string[] | undefined;
    const format = fieldSchema.format as string | undefined;
    const description = fieldSchema.description as string | undefined;
    const title = fieldSchema.title as string | undefined;

    const dataType = mapSchemaType(schemaType, format);

    // Handle nested objects (line items)
    if (dataType === 'array' && fieldSchema.items) {
      const itemsSchema = fieldSchema.items as Record<string, unknown>;
      const nestedFields = parseSchemaToFields(itemsSchema);

      // Add the array field itself
      fields.push({
        field_name: fieldName,
        display_name: title || toDisplayName(fieldName),
        data_type: 'array',
        location: 'line_item',
        required: required.includes(fieldName),
      });

      // Add nested fields with modified names
      for (const nestedField of nestedFields) {
        fields.push({
          ...nestedField,
          field_name: `${fieldName}.${nestedField.field_name}`,
          display_name: `${toDisplayName(fieldName)} > ${nestedField.display_name}`,
          location: 'line_item',
        });
      }
    } else if (dataType === 'object' && fieldSchema.properties) {
      // Handle nested objects
      const nestedFields = parseSchemaToFields(fieldSchema as Record<string, unknown>);

      for (const nestedField of nestedFields) {
        fields.push({
          ...nestedField,
          field_name: `${fieldName}.${nestedField.field_name}`,
          display_name: `${toDisplayName(fieldName)} > ${nestedField.display_name}`,
        });
      }
    } else {
      // Regular field
      fields.push({
        field_name: fieldName,
        display_name: title || description || toDisplayName(fieldName),
        data_type: dataType,
        location: inferLocation(fieldName, dataType),
        required: required.includes(fieldName),
      });
    }
  }

  return fields;
}

/**
 * Get a summary of fields by location
 */
export function getFieldsSummary(fields: TemplateField[]): {
  header: number;
  body: number;
  footer: number;
  line_item: number;
  total: number;
} {
  const summary = {
    header: 0,
    body: 0,
    footer: 0,
    line_item: 0,
    total: fields.length,
  };

  for (const field of fields) {
    const location = field.location || 'body';
    if (location in summary) {
      summary[location as keyof typeof summary]++;
    }
  }

  return summary;
}

/**
 * Group fields by location for display
 */
export function groupFieldsByLocation(fields: TemplateField[]): Record<string, TemplateField[]> {
  const groups: Record<string, TemplateField[]> = {
    header: [],
    body: [],
    footer: [],
    line_item: [],
  };

  for (const field of fields) {
    const location = field.location || 'body';
    if (groups[location]) {
      groups[location].push(field);
    } else {
      groups.body.push(field);
    }
  }

  return groups;
}
