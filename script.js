// Configuration for API endpoint
const config = {
    apiUrl: 'http://localhost:8199', // Configurable API endpoint
    timeout: 10000 // Request timeout in milliseconds
};

// Function to fetch data from API
async function fetchExpenseData() {
    try {
        const response = await fetch(config.apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // Add timeout using AbortController
            signal: AbortSignal.timeout(config.timeout)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate and normalize the data structure
        const normalizedData = normalizeApiResponse(data);
        
        return normalizedData;
    } catch (error) {
        console.error('Failed to fetch expense data:', error);
        
        // Handle different types of errors
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - please check if the server is running');
        } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to server - please check if the server is running on ' + config.apiUrl);
        } else if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
            throw new Error('Network error - this might be a CORS issue. Check if the server allows requests from this domain.');
        } else {
            throw error;
        }
    }
}

// Function to normalize API response to expected format
function normalizeApiResponse(data) {
    // Ensure the basic structure exists
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid response: Data is not an object');
    }
    
    if (!data.remaining || typeof data.remaining !== 'object') {
        throw new Error('Invalid response: Missing or invalid "remaining" field');
    }
    
    // Normalize weekday and weekend objects
    if (data.remaining.weekday) {
        if (typeof data.remaining.weekday === 'string') {
            // If it's just a string, convert to object
            data.remaining.weekday = {
                label: data.remaining.weekday,
                label_color: 'neutral' // Default color
            };
        } else if (!data.remaining.weekday.label_color) {
            // If object exists but missing label_color, add default
            data.remaining.weekday.label_color = 'neutral';
        }
    }
    
    if (data.remaining.weekend) {
        if (typeof data.remaining.weekend === 'string') {
            // If it's just a string, convert to object
            data.remaining.weekend = {
                label: data.remaining.weekend,
                label_color: 'neutral' // Default color
            };
        } else if (!data.remaining.weekend.label_color) {
            // If object exists but missing label_color, add default
            data.remaining.weekend.label_color = 'neutral';
        }
    }
    
    // Ensure days object exists
    if (!data.remaining.days || typeof data.remaining.days !== 'object') {
        throw new Error('Invalid response: Missing or invalid "days" field');
    }
    
    return data;
}

// Function to initialize the app with API data
async function initializeApp() {
    try {
        // Show loading state
        showLoadingState();
        
        const data = await fetchExpenseData();
        loadData(data);
        
        // Remove loading and error states on success
        hideLoadingState();
        removeErrorMessages();
    } catch (error) {
        console.error('Error initializing app:', error);
        // Hide loading state and display error message
        hideLoadingState();
        displayErrorMessage(error.message);
    }
}

// Function to display error messages
function displayErrorMessage(message) {
    // Remove any existing error messages first
    removeErrorMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <h3>⚠️ Error Loading Data</h3>
        <p>${message}</p>
        <button class="retry-button" onclick="retryWithFeedback()">Retry</button>
    `;
    
    // Insert error message at the top of the body
    document.body.insertBefore(errorDiv, document.body.firstChild);
}

// Function to show loading state
function showLoadingState() {
    // Remove any existing loading messages first
    hideLoadingState();
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.innerHTML = `
        <h3>📊 Loading Data</h3>
        <p>Fetching expense data from server...</p>
        <div class="loading-spinner">
            <div class="spinner"></div>
        </div>
    `;
    
    // Insert loading message at the top of the body
    document.body.insertBefore(loadingDiv, document.body.firstChild);
}

// Function to hide loading state
function hideLoadingState() {
    const loadingMessages = document.querySelectorAll('.loading-message');
    loadingMessages.forEach(msg => msg.remove());
}

// Function to remove error messages
function removeErrorMessages() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}

// Function to handle retry with visual feedback
async function retryWithFeedback() {
    // Immediately show loading state when retry is clicked
    removeErrorMessages();
    showLoadingState();
    
    // Add a small delay to ensure user sees the loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Then proceed with initialization
    await initializeApp();
}

// Helper function to update remaining amount display and styling
function updateRemainingAmount(elementId, remainingData) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`Element with id "${elementId}" not found`);
        return;
    }
    
    // Handle different data formats
    let label = '';
    let colorClass = 'neutral';
    
    if (remainingData) {
        if (typeof remainingData === 'string') {
            label = remainingData;
        } else if (typeof remainingData === 'object') {
            label = remainingData.label || '';
            colorClass = remainingData.label_color || 'neutral';
        }
    }
    
    element.textContent = label;
    
    // Remove any existing color classes
    element.classList.remove('negative', 'positive', 'neutral');
    
    // Apply color based on label_color
    switch (colorClass) {
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

// Function to refresh data from API
async function refreshData() {
    try {
        showLoadingState();
        
        const data = await fetchExpenseData();
        loadData(data);
        
        // Remove loading and error states on success
        hideLoadingState();
        removeErrorMessages();
    } catch (error) {
        console.error('Error refreshing data:', error);
        hideLoadingState();
        displayErrorMessage(error.message);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Make functions globally available for external use
window.updateData = updateData;
window.refreshData = refreshData;
window.config = config; // Allow external configuration changes

// Example of how to update with new data:
// You can now use refreshData() to fetch new data from the API
// Or use updateData() to manually update with specific data:
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

// To change the API endpoint:
// window.config.apiUrl = 'http://your-server:port/api/endpoint';
