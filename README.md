# MoneyTracker

A personal finance tracker built with React. Track your expenses, income, and budgets with beautiful visualizations.

![MoneyTracker](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan)

## Features

- **Expense Tracking**: Log daily expenses with categories and payment methods (Bank Account, Visa, MasterCard)
- **Income Tracking**: Track income from multiple sources (Job, Business, etc.)
- **Budget Management**: Set monthly budgets per category and track progress
- **Visual Analytics**: Charts and graphs showing spending trends, category breakdown, and budget comparisons
- **Data Backup**: Export/import your data as JSON files
- **Local Storage**: Your data stays in your browser - no server required

## Tech Stack

- React 18 with Vite
- Tailwind CSS for styling
- Recharts for visualizations
- React Router for navigation
- date-fns for date handling
- Lucide React for icons

## Getting Started

### Prerequisites

- Node.js 18+ installed

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/MoneyTracker.git
cd MoneyTracker

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Deployment

This app is configured for GitHub Pages deployment. Push to the `main` branch and GitHub Actions will automatically build and deploy.

**Live Demo**: `https://yourusername.github.io/MoneyTracker/`

### Manual Deployment

1. Go to your repository Settings > Pages
2. Set Source to "GitHub Actions"
3. Push to main branch to trigger deployment

## Data Storage

All data is stored in your browser's localStorage. The data structure:

```json
{
  "expenses": [...],
  "income": [...],
  "budgets": {...},
  "settings": {
    "currency": "CAD",
    "currencySymbol": "$"
  }
}
```

### Backup Your Data

1. Go to Settings page
2. Click "Export Data" to download a JSON backup
3. To restore, click "Import Data" and select your backup file

## Currency Support

Supported currencies:
- CAD (Canadian Dollar) - Default
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- BRL (Brazilian Real)
- JPY (Japanese Yen)
- AUD (Australian Dollar)

## License

MIT License - feel free to use this for your personal finance tracking!
