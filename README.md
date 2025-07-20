# Weekly Expense Tracker

A simple web application to display weekly expense data in a table format.

## Features

- **Week Overview**: Displays year, week number, current day, and remaining amounts for weekdays and weekends
- **Daily Breakdown**: Shows a 7-row table with days of the week in Bahasa Indonesia (starting from Monday/Senin)
- **Visual Indicators**:
  - **Grey/Disabled**: Days that have passed (empty string `""`)
  - **Red**: Days with "Ga ada jajan" 
  - **Blue**: Current day highlight
  - **Default**: Regular days with remaining amounts

## Data Format

The application expects data in this JSON format:

```json
{
    "year": 2025,
    "week": 29,
    "day_label": "Rabu",
    "remaining": {
        "weekday": "Rp 360.558",
        "weekend": "Rp 379.889",
        "days": ["", "", "Rp 120.186", "Rp 120.186", "Rp 120.186", "Rp 189.944", "Rp 189.944"]
    }
}
```

### Data Structure Explanation:
- `year`: The year
- `week`: Week number
- `day_label`: Current day name in Bahasa Indonesia
- `remaining.weekday`: Remaining amount for weekdays
- `remaining.weekend`: Remaining amount for weekends
- `remaining.days`: Array of 7 elements representing Monday to Sunday:
  - Empty string `""`: Day has passed (will be greyed out)
  - `"Ga ada jajan"`: No snacks allowed (will be red)
  - Any other value: Remaining amount for that day

## How to Use

1. Open `index.html` in a web browser
2. The application loads with sample data by default
3. To update with new data, use the JavaScript function:

```javascript
updateData({
    "year": 2025,
    "week": 30,
    "day_label": "Senin",
    "remaining": {
        "weekday": "Rp 400.000",
        "weekend": "Rp 200.000",
        "days": ["Rp 100.000", "Rp 100.000", "Rp 100.000", "Rp 100.000", "Rp 100.000", "Ga ada jajan", "Rp 200.000"]
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

## Files

- `index.html`: Main HTML file with clean structure
- `styles.css`: CSS stylesheet with all styling
- `script.js`: JavaScript file containing all functionality
