'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  SparklesIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  KeyIcon,
  ClockIcon,
  CloudIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  LinkIcon,
  MoonIcon,
  DevicePhoneMobileIcon,
  PencilSquareIcon,
  CodeBracketIcon,
  HandRaisedIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CapabilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface CapabilitySection {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tagline: string;
  gradient: string;
  iconBg: string;
  features: Feature[];
}

// Capability data
const CAPABILITIES: Record<string, CapabilitySection> = {
  ai: {
    icon: SparklesIcon,
    title: 'AI-Powered Intelligence',
    tagline: 'Harness the power of AI to extract, analyze, and understand your documents',
    gradient: 'from-brand-cyan-400/10 via-brand-navy-500/10 to-brand-coral-500/10',
    iconBg: 'bg-gradient-to-br from-brand-navy-500 to-brand-cyan-500',
    features: [
      {
        icon: DocumentTextIcon,
        title: 'Smart Summarization',
        description: 'Generate concise summaries in seconds. Choose from executive briefs, bullet points, or detailed overviews.',
      },
      {
        icon: QuestionMarkCircleIcon,
        title: 'FAQ Generation',
        description: 'Automatically create FAQs from your documents. Perfect for knowledge bases and customer support.',
      },
      {
        icon: AcademicCapIcon,
        title: 'Questions Generator',
        description: 'Generate comprehension questions with difficulty levels for training and assessment.',
      },
      {
        icon: ChatBubbleLeftRightIcon,
        title: 'Conversational RAG',
        description: 'Ask questions in natural language and get precise answers with source citations.',
      },
      {
        icon: MagnifyingGlassIcon,
        title: 'Semantic Search',
        description: 'Gemini-powered search with semantic, keyword, and hybrid modes across all your documents.',
      },
      {
        icon: TableCellsIcon,
        title: 'Excel Analysis',
        description: 'Query spreadsheets in natural language. Get insights from complex data without formulas.',
      },
      {
        icon: DocumentMagnifyingGlassIcon,
        title: 'Document Parsing',
        description: 'Advanced parsing for PDF, DOCX, with OCR and handwriting recognition support.',
      },
    ],
  },
  enterprise: {
    icon: ShieldCheckIcon,
    title: 'Enterprise Security',
    tagline: 'Bank-grade security with multi-tenant isolation and comprehensive audit trails',
    gradient: 'from-brand-navy-500/10 via-brand-cyan-400/10 to-brand-navy-400/10',
    iconBg: 'bg-gradient-to-br from-brand-navy-600 to-brand-navy-400',
    features: [
      {
        icon: BuildingOffice2Icon,
        title: 'Multi-Tenant Architecture',
        description: 'Complete data isolation between organizations with enterprise-grade access controls.',
      },
      {
        icon: UserGroupIcon,
        title: 'Role-Based Access',
        description: 'Admin and user roles with granular permissions. Control who sees what.',
      },
      {
        icon: ClipboardDocumentListIcon,
        title: 'Audit Logging',
        description: 'Comprehensive audit trails for compliance. Track every action across your organization.',
      },
      {
        icon: KeyIcon,
        title: 'JWT Authentication',
        description: 'Secure token-based authentication with automatic refresh for seamless sessions.',
      },
      {
        icon: ClockIcon,
        title: 'Session Management',
        description: 'Configurable session timeouts and security policies to match your requirements.',
      },
    ],
  },
  documents: {
    icon: FolderIcon,
    title: 'Document Management',
    tagline: 'Organize, search, and access your documents from anywhere',
    gradient: 'from-brand-coral-500/10 via-brand-coral-400/10 to-brand-cyan-400/10',
    iconBg: 'bg-gradient-to-br from-brand-coral-500 to-brand-coral-400',
    features: [
      {
        icon: CloudIcon,
        title: 'Cloud Storage',
        description: 'Enterprise-grade Google Cloud Storage integration with global availability.',
      },
      {
        icon: FolderIcon,
        title: 'Folder Organization',
        description: 'Hierarchical folder structure with intuitive drag-and-drop management.',
      },
      {
        icon: DocumentDuplicateIcon,
        title: 'Document Versioning',
        description: 'Track changes and maintain complete document history for compliance.',
      },
      {
        icon: ArrowPathIcon,
        title: 'Real-time Status',
        description: 'Live processing status tracking from upload to ready state.',
      },
      {
        icon: LinkIcon,
        title: 'Secure Links',
        description: 'Time-limited signed URLs for secure document sharing and downloads.',
      },
    ],
  },
  experience: {
    icon: DevicePhoneMobileIcon,
    title: 'Modern Experience',
    tagline: 'A beautiful, accessible interface that works on any device',
    gradient: 'from-brand-cyan-400/10 via-brand-coral-400/10 to-brand-navy-400/10',
    iconBg: 'bg-gradient-to-br from-brand-cyan-500 to-brand-cyan-400',
    features: [
      {
        icon: MoonIcon,
        title: 'Dark Mode',
        description: 'System-aware theme switching. Easy on the eyes, day or night.',
      },
      {
        icon: DevicePhoneMobileIcon,
        title: 'Responsive Design',
        description: 'Optimized for desktop, tablet, and mobile workflows.',
      },
      {
        icon: PencilSquareIcon,
        title: 'Rich Text Editor',
        description: 'TipTap-based editor with tables and formatting support.',
      },
      {
        icon: CodeBracketIcon,
        title: 'Markdown Rendering',
        description: 'Full markdown support with syntax highlighting for code blocks.',
      },
      {
        icon: HandRaisedIcon,
        title: 'Accessibility',
        description: 'WCAG-compliant with keyboard navigation and screen reader support.',
      },
    ],
  },
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
};

// Feature Card Component
function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -4 }}
      className={clsx(
        'group relative p-5 rounded-xl',
        'bg-white dark:bg-gray-800/80',
        'border border-gray-200 dark:border-gray-700',
        'shadow-sm hover:shadow-lg',
        'transition-shadow duration-300'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-br from-brand-cyan-400/10 to-brand-navy-500/10 dark:from-brand-cyan-400/20 dark:to-brand-navy-400/20">
          <Icon className="w-5 h-5 text-brand-cyan-600 dark:text-brand-cyan-400" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            {feature.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Section Component
function CapabilitySection({ section }: { section: CapabilitySection }) {
  const Icon = section.icon;
  return (
    <motion.section
      variants={sectionVariants}
      className="mb-10 last:mb-0"
    >
      {/* Section Header */}
      <div className={clsx('rounded-2xl p-6 mb-6 bg-gradient-to-r', section.gradient)}>
        <div className="flex items-center gap-4 mb-3">
          <div className={clsx('p-3 rounded-xl text-white shadow-lg', section.iconBg)}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {section.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {section.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {section.features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} />
        ))}
      </motion.div>
    </motion.section>
  );
}

// Main Modal Component
export function CapabilitiesModal({ isOpen, onClose }: CapabilitiesModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal Container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={clsx(
                  'w-full max-w-6xl transform overflow-hidden rounded-2xl',
                  'bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800',
                  'shadow-2xl transition-all',
                  'border border-gray-200/50 dark:border-gray-700/50'
                )}
              >
                {/* Header */}
                <div className="relative overflow-hidden">
                  {/* Gradient Background - Brand Colors */}
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-navy-500 via-brand-cyan-400 to-brand-coral-500" />
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={onClose}
                    className={clsx(
                      'absolute top-4 right-4 z-10 p-2 rounded-full',
                      'bg-white/20 hover:bg-white/40',
                      'text-white transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-white/50',
                      'cursor-pointer'
                    )}
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>

                  {/* Hero Content */}
                  <div className="relative px-8 py-12 text-center text-white">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                        <RocketLaunchIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">Document Intelligence Platform</span>
                      </div>

                      <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        Transform Your Documents Into
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan-200 via-white to-brand-coral-200">
                          Actionable Insights
                        </span>
                      </h1>

                      <p className="text-lg text-white/80 max-w-2xl mx-auto">
                        Powered by Google Gemini, OpenAI, and enterprise-grade infrastructure,
                        Biz-To-Bricks helps small businesses unlock the full potential of their documents.
                      </p>
                    </motion.div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="max-h-[60vh] overflow-y-auto p-8">
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                  >
                    {Object.values(CAPABILITIES).map((section, index) => (
                      <CapabilitySection key={index} section={section} />
                    ))}
                  </motion.div>

                  {/* Footer CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-10 text-center"
                  >
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-brand-navy-500/10 via-brand-cyan-400/10 to-brand-coral-500/10 dark:from-brand-navy-400/20 dark:via-brand-cyan-400/20 dark:to-brand-coral-400/20 border border-brand-cyan-200 dark:border-brand-cyan-800">
                      <SparklesIcon className="w-5 h-5 text-brand-cyan-500 dark:text-brand-cyan-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Start exploring your documents with AI today
                      </span>
                    </div>
                  </motion.div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default CapabilitiesModal;
