# ShanCi Expense Tracker

A comprehensive expense tracking application with both weekly and monthly views.

> **v2 "Amplop" (Phase 3 cutover).** The envelope-budgeting redesign is now the
> app root (see `docs/v2-amplop-redesign-plan.md`). It mounts at **`/`**
> (`index.html`); the previous vanilla app is preserved at **`/legacy.html`**.
> Its **hidden settings page** (budget config + subscriptions) is
> **`/settings.html`** — there is intentionally no in-app link to it; reach it
> by typing the URL. The v2 app talks to the `expense-functions` backend via
> `VITE_API_BASE_URL` (default `http://localhost:8080`).

## Features

### 🗓️ Weekly Expense Tracking
- Track daily expenses throughout the week
- View remaining budget for weekdays, Saturdays, and Sundays
- Detailed expense breakdown by day
- Add expenses with custom date/time, type, and notes

### 📅 Monthly Expense Tracking (NEW!)
- Track expenses across the entire month
- View monthly budget vs. actual spending
- Week-by-week breakdown of expenses
- Month navigation (previous/next month)
- Detailed monthly expense list grouped by date

### ✨ Enhanced User Experience
- **Smooth Tab Navigation**: Seamlessly switch between weekly and monthly views
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Smart Modal System**: Context-aware expense addition (weekly vs monthly)
- **Real-time Updates**: Data refreshes automatically when switching tabs
- **Beautiful Animations**: Smooth transitions and hover effects

## Tab System

The application now features a modern tab-based interface:

### Weekly Tab (📅 Mingguan)
- Original weekly expense functionality
- Daily budget tracking
- Week-specific expense details

### Monthly Tab (🗓️ Bulanan)
- New monthly overview
- Monthly budget tracking (total and remaining)
- Week-by-week expense breakdown
- Month navigation controls
- Comprehensive monthly expense details

## Usage

### Adding Expenses

1. **Weekly Expenses**: Click "Tambah Pengeluaran" in the Weekly tab
2. **Monthly Expenses**: Click "Tambah Pengeluaran" in the Monthly tab
3. Fill in the expense details:
   - Amount (can be negative with +/- button)
   - Date & Time (optional - defaults to current time)
   - Type (Konsumsi, Belanja, Laundry, Lainnya)
   - Notes (optional)

### Navigating Monthly View

- Use **"Bulan Sebelumnya"** and **"Bulan Selanjutnya"** buttons to navigate between months
- Click on expense detail rows to view full information
- Week rows show summary information for each week in the month

### Viewing Expense Details

- Click on any expense row in the details tables to open a detailed view
- Details include full date/time, type, amount, and notes

## Technical Improvements

### Modular Architecture
- **tabs.js**: Tab navigation and transitions
- **monthly.js**: Monthly expense functionality
- **modal.js**: Enhanced to support both weekly and monthly contexts
- **details.js**: Shared detail viewing functionality
- **main.js**: Orchestrates all modules

### Enhanced Styling
- Modern tab interface with smooth transitions
- Responsive design for all screen sizes
- Color-coded budget indicators
- Hover effects and animations
- Improved table layouts for monthly data

### Smart Data Management
- Context-aware API calls (weekly vs monthly)
- Automatic data refresh on tab switches
- Simulated monthly data (can be connected to real monthly API)
- Error handling and loading states

## Environment Variables

```env
VITE_GET_WEEKLY_EXPENSE_URL=your_weekly_api_endpoint
VITE_ADD_WEEKLY_EXPENSE_URL=your_weekly_add_endpoint
VITE_GET_MONTHLY_EXPENSE_URL=your_monthly_api_endpoint  # Optional
VITE_ADD_MONTHLY_EXPENSE_URL=your_monthly_add_endpoint  # Optional
VITE_API_TIMEOUT=5000
```

Note: If monthly-specific URLs are not provided, the application will fall back to using the weekly endpoints with context parameters.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

## Mobile Support

The application is fully responsive and provides an optimal experience on:
- Desktop computers (full feature set)
- Tablets (adapted layout)
- Mobile phones (simplified layout, touch-friendly)

## Future Enhancements

- Export monthly/weekly reports
- Expense categories analytics
- Budget planning tools
- Data visualization charts
- Offline support
- Multi-currency support

---

Built with ❤️ using Vite + Vanilla JavaScript
