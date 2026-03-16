# MoneyTracker UI Redesign Plan

**Branch:** `redesign/tailadmin-ui`
**Base Template:** TailAdmin React
**Created:** 2026-03-16

---

## Design Decisions

- **Template:** TailAdmin React (React 19 + Tailwind CSS v4 + Vite)
- **Scope:** Full overhaul of all pages and components
- **Dark Mode:** Yes, full light/dark toggle with CSS variable theming
- **Table Library:** @tanstack/react-table
- **Command Palette:** cmdk library
- **Icons:** Lucide React (keep existing)
- **Charts:** Recharts (keep existing)
- **Animations:** Framer Motion (keep existing)

---

## STATUS TRACKER

### Phase 1: Foundation (Design System + Infrastructure)
- [ ] **1.1** Rewrite design token system in `src/index.css`
  - [ ] 1.1.1 Define light theme CSS variables (slate-based neutrals, indigo accent)
  - [ ] 1.1.2 Define dark theme CSS variables under `[data-theme="dark"]`
  - [ ] 1.1.3 Add sidebar tokens for expanded and collapsed states
  - [ ] 1.1.4 Add transition/animation CSS variables
  - [ ] 1.1.5 Self-host Inter and JetBrains Mono fonts
  - [ ] 1.1.6 Remove old component classes (.card, .btn, .input, .badge) — will be replaced by React components
- [ ] **1.2** Create reusable UI component library (`src/components/ui/`)
  - [ ] 1.2.1 `Button.jsx` — Primary, secondary, outline, ghost, danger variants + sm/md/lg sizes
  - [ ] 1.2.2 `Card.jsx` — Base card, stat card, chart card with header/body/footer slots
  - [ ] 1.2.3 `Input.jsx` — Text, number, date inputs with label, error state, icon support
  - [ ] 1.2.4 `Select.jsx` — Styled select with search capability
  - [ ] 1.2.5 `Badge.jsx` — Status badges with color variants (success, danger, warning, info, neutral)
  - [ ] 1.2.6 `Modal.jsx` — Portal-based modal with backdrop, sm/md/lg/xl sizes, animations
  - [ ] 1.2.7 `Table.jsx` — Wrapper around @tanstack/react-table with sorting, filtering, pagination
  - [ ] 1.2.8 `Dropdown.jsx` — Dropdown menu with keyboard navigation
  - [ ] 1.2.9 `EmptyState.jsx` — Consistent empty data placeholder with icon + message + action
  - [ ] 1.2.10 `Spinner.jsx` — Loading indicators (spinner, skeleton, dots)
  - [ ] 1.2.11 `Toggle.jsx` — Theme toggle switch, generic toggle
  - [ ] 1.2.12 `Tooltip.jsx` — Hover tooltips
  - [ ] 1.2.13 `CommandPalette.jsx` — Cmd+K overlay using cmdk library
  - [ ] 1.2.14 `BottomNav.jsx` — Mobile bottom navigation bar
  - [ ] 1.2.15 `index.js` — Barrel export file
- [ ] **1.3** Create Theme Provider (`src/context/ThemeContext.jsx`)
  - [ ] 1.3.1 ThemeProvider component with useTheme() hook
  - [ ] 1.3.2 Persist theme preference to localStorage
  - [ ] 1.3.3 Respect `prefers-color-scheme` as default
  - [ ] 1.3.4 Apply `data-theme` attribute to `<html>` element
- [ ] **1.4** Create route configuration (`src/config/routes.js`)
  - [ ] 1.4.1 Single source of truth for nav items, page titles, descriptions, icons
  - [ ] 1.4.2 Export helper functions for route lookup
- [ ] **1.5** Install new dependencies
  - [ ] 1.5.1 `npm install @tanstack/react-table cmdk`
- [ ] **1.6** Create `useMediaQuery` hook (`src/hooks/useMediaQuery.js`)

### Phase 2: Layout Shell
- [ ] **2.1** Rewrite Sidebar (`src/components/Layout/Sidebar.jsx`)
  - [ ] 2.1.1 Desktop: collapsible between expanded (260px) and collapsed (80px, icons-only)
  - [ ] 2.1.2 Mobile: slide-out drawer with backdrop overlay
  - [ ] 2.1.3 Remove injected `<style>` tag anti-pattern
  - [ ] 2.1.4 Replace onMouseEnter/onMouseLeave with Tailwind hover: utilities
  - [ ] 2.1.5 Persist collapse state to localStorage
  - [ ] 2.1.6 Smooth width transition animation
  - [ ] 2.1.7 Tooltip on collapsed icons
  - [ ] 2.1.8 Active route indicator (left border highlight)
  - [ ] 2.1.9 Section groupings: "Main" + "Tools"
  - [ ] 2.1.10 Dynamic footer (localStorage vs Google Drive status)
  - [ ] 2.1.11 Dark mode support
- [ ] **2.2** Rewrite Header (`src/components/Layout/Header.jsx`)
  - [ ] 2.2.1 CSS variable background with backdrop-blur (no hardcoded RGBA)
  - [ ] 2.2.2 Theme toggle button
  - [ ] 2.2.3 Cmd+K shortcut hint button
  - [ ] 2.2.4 Notification bell placeholder
  - [ ] 2.2.5 Page title from route config
  - [ ] 2.2.6 Responsive collapse on mobile
  - [ ] 2.2.7 Dark mode support
- [ ] **2.3** Rewrite Layout shell (`src/components/Layout/Layout.jsx`)
  - [ ] 2.3.1 CSS-driven responsive layout (remove JS resize listener)
  - [ ] 2.3.2 Sidebar width via CSS variables + transitions
  - [ ] 2.3.3 Render CommandPalette at layout level
  - [ ] 2.3.4 Render BottomNav on mobile
  - [ ] 2.3.5 Lazy-load all page components
  - [ ] 2.3.6 Dark mode support

### Phase 3: Page Redesigns
- [ ] **3.1** Dashboard — Break into sub-components
  - [ ] 3.1.1 Create `src/components/Dashboard/` folder structure
  - [ ] 3.1.2 `Dashboard.jsx` — Main orchestrator
  - [ ] 3.1.3 `DashboardHeader.jsx` — Title + PeriodSelector
  - [ ] 3.1.4 `PeriodSelector.jsx` — Extract from Dashboard
  - [ ] 3.1.5 `StatCardsGrid.jsx` — 4 stat cards with sparkline trends
  - [ ] 3.1.6 `CashFlowChart.jsx` — Area chart with improved tooltips
  - [ ] 3.1.7 `CategoryPieChart.jsx` — Donut chart with interactive legend
  - [ ] 3.1.8 `CategorySpendingList.jsx` — Progress bars with expandable detail
  - [ ] 3.1.9 `RecentActivity.jsx` — Timeline-style recent transactions
  - [ ] 3.1.10 `BudgetOverview.jsx` — NEW: Mini budget progress widget
  - [ ] 3.1.11 New widget: Top spending category highlight card
  - [ ] 3.1.12 New widget: Month vs last month comparison mini-chart
  - [ ] 3.1.13 Dark mode support for all charts
  - [ ] 3.1.14 Remove dead imports (unused BarChart/Bar)
- [ ] **3.2** Expenses Page (`src/components/ExpenseList.jsx`)
  - [ ] 3.2.1 Replace list with @tanstack/react-table sortable table
  - [ ] 3.2.2 Category, date range, payment method filters
  - [ ] 3.2.3 Pagination (10/25/50 per page)
  - [ ] 3.2.4 Inline edit capability
  - [ ] 3.2.5 Bulk select + delete
  - [ ] 3.2.6 Mobile card view (responsive)
  - [ ] 3.2.7 Dark mode support
- [ ] **3.3** Income Page (`src/components/IncomeList.jsx`)
  - [ ] 3.3.1 Same table improvements as Expenses
  - [ ] 3.3.2 Source-based filtering and grouping
  - [ ] 3.3.3 Dark mode support
- [ ] **3.4** Budget Page (`src/components/BudgetManager.jsx`)
  - [ ] 3.4.1 Redesigned progress bars with percentage labels
  - [ ] 3.4.2 Color-coded status (green/yellow/red)
  - [ ] 3.4.3 Improved "Add budget" flow
  - [ ] 3.4.4 Monthly/quarterly view toggle
  - [ ] 3.4.5 Dark mode support
- [ ] **3.5** Compare Page (`src/components/Compare.jsx`)
  - [ ] 3.5.1 Improved chart visualizations
  - [ ] 3.5.2 Side-by-side comparison cards
  - [ ] 3.5.3 Aligned period selector
  - [ ] 3.5.4 Dark mode support
- [ ] **3.6** Settings Page (`src/components/Settings.jsx`)
  - [ ] 3.6.1 Grouped settings sections with cards
  - [ ] 3.6.2 Theme section with toggle
  - [ ] 3.6.3 Better import/export UX
  - [ ] 3.6.4 Google Drive sync status indicator
  - [ ] 3.6.5 Dark mode support
- [ ] **3.7** Onboarding (`src/components/Onboarding.jsx`)
  - [ ] 3.7.1 Modernized step wizard with progress indicator
  - [ ] 3.7.2 Better visual hierarchy
  - [ ] 3.7.3 Animated step transitions
  - [ ] 3.7.4 Dark mode support

### Phase 4: New Features
- [ ] **4.1** Command Palette (Cmd+K)
  - [ ] 4.1.1 Global keyboard shortcut listener (Cmd+K / Ctrl+K)
  - [ ] 4.1.2 Search across pages and actions
  - [ ] 4.1.3 Search recent transactions
  - [ ] 4.1.4 Quick actions: "Add expense", "Add income", "Export data"
  - [ ] 4.1.5 Fuzzy matching
  - [ ] 4.1.6 Dark mode support
- [ ] **4.2** Toast/Notification Redesign
  - [ ] 4.2.1 Restyle react-hot-toast to match new design system
  - [ ] 4.2.2 Theme-aware colors
  - [ ] 4.2.3 Consistent positioning and animations
- [ ] **4.3** Mobile Bottom Navigation
  - [ ] 4.3.1 5-tab bottom bar: Dashboard, Expenses, Income, Budget, More
  - [ ] 4.3.2 "More" opens bottom sheet with additional links
  - [ ] 4.3.3 Hide sidebar hamburger on mobile
  - [ ] 4.3.4 Smooth route transitions

### Phase 5: Polish & Cleanup
- [ ] **5.1** Code Cleanup
  - [ ] 5.1.1 Remove all dead imports across codebase
  - [ ] 5.1.2 Remove duplicate /scan-receipt route handling
  - [ ] 5.1.3 Verify all page components are lazy-loaded
- [ ] **5.2** Accessibility Audit
  - [ ] 5.2.1 Add ARIA labels to navigation, modals, interactive elements
  - [ ] 5.2.2 Keyboard trap management for modals and sidebar
  - [ ] 5.2.3 Focus-visible styles on all interactive elements
  - [ ] 5.2.4 Skip-to-content link
  - [ ] 5.2.5 Respect prefers-reduced-motion
- [ ] **5.3** Animation Refinement
  - [ ] 5.3.1 Consistent page transitions
  - [ ] 5.3.2 Micro-interactions on buttons, cards, toggles
  - [ ] 5.3.3 Respect prefers-reduced-motion in Framer Motion
- [ ] **5.4** Testing
  - [ ] 5.4.1 Update Vitest unit tests for new component structure
  - [ ] 5.4.2 Update Playwright E2E tests for new layout
  - [ ] 5.4.3 Add tests for theme switching
  - [ ] 5.4.4 Add tests for sidebar collapse
  - [ ] 5.4.5 Add tests for command palette

---

## New File Structure

```
src/
  config/
    routes.js                        # NEW
  context/
    MoneyContext.jsx                  # EXISTING (unchanged)
    ThemeContext.jsx                  # NEW
  components/
    ui/                              # NEW folder
      Button.jsx
      Card.jsx
      Input.jsx
      Select.jsx
      Badge.jsx
      Modal.jsx
      Table.jsx
      Dropdown.jsx
      EmptyState.jsx
      Spinner.jsx
      Toggle.jsx
      Tooltip.jsx
      CommandPalette.jsx
      BottomNav.jsx
      index.js
    Layout/
      Layout.jsx                     # REWRITE
      Sidebar.jsx                    # REWRITE
      Header.jsx                     # REWRITE
    Dashboard/                       # NEW folder (split from single file)
      Dashboard.jsx
      DashboardHeader.jsx
      StatCardsGrid.jsx
      CashFlowChart.jsx
      CategoryPieChart.jsx
      CategorySpendingList.jsx
      RecentActivity.jsx
      BudgetOverview.jsx
      PeriodSelector.jsx
    ExpenseList.jsx                  # REWRITE
    IncomeList.jsx                   # REWRITE
    BudgetManager.jsx                # REWRITE
    Compare.jsx                      # REWRITE
    Settings.jsx                     # REWRITE
    Onboarding.jsx                   # REWRITE
  hooks/
    useMediaQuery.js                 # NEW
  App.jsx                            # MODIFY
  index.css                          # REWRITE
```

---

## Dependencies to Add

```json
{
  "@tanstack/react-table": "^8.x",
  "cmdk": "^1.x"
}
```

---

## Key Constraints

- All existing functionality MUST be preserved (localStorage, Google Drive sync, PDF import, OCR scanner, onboarding)
- MoneyContext and all business logic (calculations.js, categories.js) remain unchanged
- Only UI layer is being rebuilt
- HashRouter stays for GitHub Pages compatibility
- No backend changes
