// Sample data - replace this with your actual data
const sampleData = {
    "year": 2025,
    "week": 29,
    "day_label": "Rabu",
    "date_range": "14 Jul 2025 - 17 Jul 2025", // Add this field in your response
    "remaining": {
        "weekday": {
            "label": "- Rp 1.000",
            "label_color": "red"
        },
        "weekend": {
            "label": "Rp 379.889",
            "label_color": "green"
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
};

// Helper function to update remaining amount display and styling
function updateRemainingAmount(elementId, remainingData) {
    const element = document.getElementById(elementId);
    element.textContent = remainingData.label;
    
    // Remove any existing color classes
    element.classList.remove('negative', 'positive', 'neutral');
    
    // Apply color based on label_color
    switch (remainingData.label_color) {
        case 'red':
            element.classList.add('negative');
            break;
        case 'green':
            element.classList.add('positive');
            break;
        default:
            element.classList.add('neutral');
            break;
    }
}

function populateHeader(data) {
    document.getElementById('dateRange').textContent = data.date_range || `${data.week}, ${data.year}`;
    document.getElementById('weekInfo').textContent = `${data.week}, ${data.year}`;
    
    // Update weekday and weekend remaining amounts
    updateRemainingAmount('weekdayRemaining', data.remaining.weekday);
    updateRemainingAmount('weekendRemaining', data.remaining.weekend);
}

function populateTable(data) {
    const tableBody = document.getElementById('expenseTableBody');
    tableBody.innerHTML = '';

    Object.keys(data.remaining.days).forEach((dayName) => {
        const amount = data.remaining.days[dayName] || '';
        const row = document.createElement('tr');
        
        // Determine the row class based on the amount
        let rowClass = '';
        let displayAmount = amount;
        
        if (amount === '') {
            rowClass = 'passed-day';
            displayAmount = '';
        } else if (amount === 'Ga ada jajan') {
            rowClass = 'no-snack';
            displayAmount = 'Ga ada jajan';
        } else {
            // Check if this is the current day
            if (dayName === data.day_label) {
                rowClass = 'current-day';
            }
        }
        
        row.className = rowClass;
        
        row.innerHTML = `
            <td class="day-name">${dayName}</td>
            <td class="amount">${displayAmount}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function loadData(data) {
    populateHeader(data);
    populateTable(data);
}

// Function to update data (you can call this with new data)
function updateData(newData) {
    loadData(newData);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadData(sampleData);
});

// Make updateData globally available for external use
window.updateData = updateData;

// Example of how to update with new data:
// updateData({
//     "year": 2025,
//     "week": 30,
//     "day_label": "Senin",
//     "date_range": "21 - 27 Jul 2025",
//     "remaining": {
//         "weekday": {
//             "label": "Rp -50.000",
//             "label_color": "red"
//         },
//         "weekend": {
//             "label": "Rp 200.000",
//             "label_color": "green"
//         },
//         "days": {
//             "Senin": "Rp 100.000",
//             "Selasa": "Rp 100.000",
//             "Rabu": "Rp 100.000",
//             "Kamis": "Rp 100.000",
//             "Jumat": "Rp 100.000",
//             "Sabtu": "Ga ada jajan",
//             "Minggu": "Rp 200.000"
//         }
//     }
// });
