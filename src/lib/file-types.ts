import {
  DocumentTextIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  CodeBracketIcon,
  PresentationChartLineIcon,
  TableCellsIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

export interface FileTypeInfo {
  icon: any;
  color: string;
  bgColor: string;
  category: 'document' | 'spreadsheet' | 'presentation' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'other';
  displayName: string;
  preview?: boolean;
}

export const fileTypeMap: Record<string, FileTypeInfo> = {
  // Documents
  pdf: {
    icon: DocumentTextIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    category: 'document',
    displayName: 'PDF',
    preview: true,
  },
  doc: {
    icon: DocumentTextIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    category: 'document',
    displayName: 'Word',
  },
  docx: {
    icon: DocumentTextIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    category: 'document',
    displayName: 'Word',
  },
  txt: {
    icon: DocumentIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    category: 'document',
    displayName: 'Text',
  },
  rtf: {
    icon: DocumentTextIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    category: 'document',
    displayName: 'RTF',
  },
  
  // Spreadsheets
  xls: {
    icon: TableCellsIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    category: 'spreadsheet',
    displayName: 'Excel',
  },
  xlsx: {
    icon: TableCellsIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    category: 'spreadsheet',
    displayName: 'Excel',
  },
  csv: {
    icon: TableCellsIcon,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    category: 'spreadsheet',
    displayName: 'CSV',
  },
  
  // Presentations
  ppt: {
    icon: PresentationChartLineIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    category: 'presentation',
    displayName: 'PowerPoint',
  },
  pptx: {
    icon: PresentationChartLineIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    category: 'presentation',
    displayName: 'PowerPoint',
  },
  
  // Images
  jpg: {
    icon: PhotoIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    category: 'image',
    displayName: 'JPEG',
    preview: true,
  },
  jpeg: {
    icon: PhotoIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    category: 'image',
    displayName: 'JPEG',
    preview: true,
  },
  png: {
    icon: PhotoIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    category: 'image',
    displayName: 'PNG',
    preview: true,
  },
  gif: {
    icon: PhotoIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    category: 'image',
    displayName: 'GIF',
    preview: true,
  },
  svg: {
    icon: PhotoIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    category: 'image',
    displayName: 'SVG',
    preview: true,
  },
  
  // Videos
  mp4: {
    icon: FilmIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
    category: 'video',
    displayName: 'MP4',
  },
  avi: {
    icon: FilmIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
    category: 'video',
    displayName: 'AVI',
  },
  mov: {
    icon: FilmIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
    category: 'video',
    displayName: 'MOV',
  },
  
  // Audio
  mp3: {
    icon: MusicalNoteIcon,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-200',
    category: 'audio',
    displayName: 'MP3',
  },
  wav: {
    icon: MusicalNoteIcon,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-200',
    category: 'audio',
    displayName: 'WAV',
  },
  
  // Code
  js: {
    icon: CodeBracketIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    category: 'code',
    displayName: 'JavaScript',
  },
  ts: {
    icon: CodeBracketIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    category: 'code',
    displayName: 'TypeScript',
  },
  py: {
    icon: CodeBracketIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    category: 'code',
    displayName: 'Python',
  },
  html: {
    icon: CodeBracketIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    category: 'code',
    displayName: 'HTML',
  },
  css: {
    icon: CodeBracketIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    category: 'code',
    displayName: 'CSS',
  },
  
  // Archives
  zip: {
    icon: ArchiveBoxIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    category: 'archive',
    displayName: 'ZIP',
  },
  rar: {
    icon: ArchiveBoxIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    category: 'archive',
    displayName: 'RAR',
  },
  '7z': {
    icon: ArchiveBoxIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    category: 'archive',
    displayName: '7Z',
  },
};

export const getFileTypeInfo = (filename: string, mimeType?: string): FileTypeInfo => {
  // Extract extension from filename
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // Check if we have a specific mapping for this extension
  if (fileTypeMap[extension]) {
    return fileTypeMap[extension];
  }
  
  // Fallback to mime type detection if available
  if (mimeType) {
    if (mimeType.startsWith('image/')) {
      return {
        icon: PhotoIcon,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50 border-pink-200',
        category: 'image',
        displayName: 'Image',
        preview: true,
      };
    }
    if (mimeType.startsWith('video/')) {
      return {
        icon: FilmIcon,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 border-indigo-200',
        category: 'video',
        displayName: 'Video',
      };
    }
    if (mimeType.startsWith('audio/')) {
      return {
        icon: MusicalNoteIcon,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50 border-teal-200',
        category: 'audio',
        displayName: 'Audio',
      };
    }
    if (mimeType.includes('pdf')) {
      return {
        icon: DocumentTextIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        category: 'document',
        displayName: 'PDF',
        preview: true,
      };
    }
  }
  
  // Default fallback
  return {
    icon: DocumentIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    category: 'other',
    displayName: extension.toUpperCase() || 'File',
  };
};

export const formatFileSize = (bytes: number): string => {
  // Handle undefined, null, NaN, or zero values
  if (!bytes || isNaN(bytes) || bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));

  // Handle NaN from calculation
  if (isNaN(size)) return '0 B';

  // Don't show decimal for bytes
  if (i === 0) {
    return `${Math.round(size)} ${sizes[i]}`;
  }

  return `${size} ${sizes[i]}`;
};