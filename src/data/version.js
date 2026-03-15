export const APP_VERSION = '1.5.0'

export const CHANGELOG = [
  {
    version: '1.5.0',
    date: '2026-03-15',
    title: 'Dependency Updates & UI Polish',
    changes: [
      'Show category name as primary label in expense lists',
      'Description now appears as secondary text below the category',
      'Updated all dependencies to latest compatible versions',
      'Upgraded Vite to 7.3.1, Vitest to 4.1.0, Tailwind CSS to 4.2.1',
      'Upgraded React to 19.2.4, React Router to 7.13.1, Recharts to 3.8.0',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-03-10',
    title: 'Bank Statement Import',
    changes: [
      'Import expenses from bank statement PDFs (CIBC supported)',
      'Auto-categorization of imported transactions',
      'Date range filter for import review step',
      'Code-split PDF.js for smaller initial bundle',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-02-20',
    title: 'Category Insights & Testing',
    changes: [
      'Category expenses drill-down modal with edit capability',
      'Category spending breakdown on dashboard',
      'Updated layout, forms, and styling',
      'Added end-to-end test suite',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-02-01',
    title: 'Comparisons & Onboarding',
    changes: [
      'Month-by-month expense comparison page',
      'Period filter with custom date range on dashboard',
      'Try Demo button with full year of sample data',
      'Multi-step onboarding with budget setup and currency selection',
      'Custom categories in budget setup',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-01-15',
    title: 'Receipt Scanning & Cloud Backup',
    changes: [
      'Receipt scanning with OCR (Tesseract.js)',
      'Scan with Phone via QR code for desktop users',
      'Google Drive backup and automatic sync',
      'Payment method display in expense list',
      'Improved category selection in expense form',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-01-01',
    title: 'Initial Release',
    changes: [
      'Expense and income tracking with full CRUD',
      'Budget management per category',
      'Interactive dashboard with charts',
      'Modern UI with animations and dark mode',
      'Mobile-friendly responsive design',
      'Local storage - no server, complete privacy',
    ],
  },
]
