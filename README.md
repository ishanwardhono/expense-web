# Weekly Expense Tracker

A modern web application built with Vite to display weekly expense data in a clean, responsive table format.

## Features

- **Modern Development Stack**: Built with Vite for fast development and optimized builds
- **API Integration**: Fetches real-time data from a configurable API endpoint
- **Week Overview**: Displays year, week number, current day, and remaining amounts for weekdays and weekends
- **Daily Breakdown**: Shows a 7-row table with days of the week in Bahasa Indonesia (starting from Monday/Senin)
- **Error Handling**: Comprehensive error handling with user-friendly messages and retry functionality
- **Loading States**: Visual loading indicators during API calls
- **Visual Indicators**:
  - **Grey/Disabled**: Days that have passed (empty string `""`)
  - **Red**: Days with "Ga ada jajan" 
  - **Blue**: Current day highlight
  - **Color-coded amounts**: Support for red/green/neutral color coding based on API response

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000` and will automatically reload when you make changes.

### Building for Production

To build the application for production:
```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

To preview the production build locally:
```bash
npm run preview
```

## API Configuration

The application is configured to fetch data from a REST API. You can configure the endpoint:

```javascript
// Default configuration
window.config.apiUrl = 'http://localhost:8199'; // Change this to your API endpoint
window.config.timeout = 10000; // Request timeout in milliseconds
```

### Expected API Response Format

The API should return data in this JSON format:

```json
{
    "year": 2025,
    "week": 29,
    "day_label": "Rabu",
    "date_range": "21 - 27 Jul 2025",
    "remaining": {
        "weekday": {
            "label": "Rp 360.558",
            "label_color": "green"
        },
        "weekend": {
            "label": "Rp 379.889", 
            "label_color": "red"
        },
        "days": {
            "Senin": "",
            "Selasa": "",
            "Rabu": "Rp 120.186",
            "Kamis": "Rp 120.186", 
            "Jumat": "Rp 120.186",
            "Sabtu": "Rp 189.944",
            "Minggu": "Rp 189.944"
        }
    }
}
```

### Data Structure Explanation:
- `year`: The year
- `week`: Week number
- `day_label`: Current day name in Bahasa Indonesia
- `date_range`: Optional date range string for display
- `remaining.weekday`: Object with label and color information for weekdays
  - `label`: Display text
  - `label_color`: Color indicator ("red", "green", or "neutral")
- `remaining.weekend`: Object with label and color information for weekends
- `remaining.days`: Object with day names as keys and remaining amounts as values:
  - Empty string `""`: Day has passed (will be greyed out)
  - `"Ga ada jajan"`: No snacks allowed (will be red)
  - Any other value: Remaining amount for that day

## Functions Available

### Global Functions
- `refreshData()`: Fetch fresh data from the API
- `updateData(newData)`: Update display with specific data object
- `window.config`: Configuration object for API settings

### Manual Data Update Example

```javascript
updateData({
    "year": 2025,
    "week": 30,
    "day_label": "Senin",
    "date_range": "28 Jul - 3 Aug 2025",
    "remaining": {
        "weekday": {
            "label": "Rp -50.000",
            "label_color": "red"
        },
        "weekend": {
            "label": "Rp 200.000",
            "label_color": "green"
        },
        "days": {
            "Senin": "Rp 100.000",
            "Selasa": "Rp 100.000",
            "Rabu": "Rp 100.000",
            "Kamis": "Rp 100.000",
            "Jumat": "Rp 100.000",
            "Sabtu": "Ga ada jajan",
            "Minggu": "Rp 200.000"
        }
    }
});
```

## Days of the Week

The table displays days in Bahasa Indonesia:
1. Senin (Monday)
2. Selasa (Tuesday)
3. Rabu (Wednesday)
4. Kamis (Thursday)
5. Jumat (Friday)
6. Sabtu (Saturday)
7. Minggu (Sunday)

## Styling

- **Passed days**: Grey background and text with reduced opacity
- **"Ga ada jajan"**: Red background with red text
- **Current day**: Blue background with blue text
- **Regular days**: Default styling with hover effects
- **Responsive**: Works on mobile devices

## Project Structure

```
weekly-expense-tracker/
├── src/
│   ├── main.js          # Main JavaScript module with all functionality
│   └── style.css        # CSS stylesheet with all styling
├── index.html           # Main HTML file
├── vite.config.js       # Vite configuration
├── package.json         # Node.js dependencies and scripts
└── README.md           # This file
```

## Technologies Used

- **Vite**: Modern build tool and development server
- **Vanilla JavaScript**: ES6+ modules for clean, maintainable code
- **CSS3**: Modern styling with flexbox, grid, and animations
- **Fetch API**: For HTTP requests to the backend API

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (recent versions)
- Mobile browsers with modern JavaScript support
