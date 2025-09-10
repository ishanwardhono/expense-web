// Monthly expense functionality

const config = {
    getMonthlyExpenseUrl: import.meta.env.VITE_GET_MONTHLY_EXPENSE_URL,
    addMonthlyExpenseUrl: import.meta.env.VITE_ADD_MONTHLY_EXPENSE_URL,
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 5000
};

let currentMonth = new Date();
let monthlyData = null;

// Function to reset monthly data
export function resetMonthlyData() {
    monthlyData = null;
    currentMonth = new Date();
    
    // Clear the display elements
    const monthDateRange = document.getElementById('monthDateRange');
    const monthSubtitle = document.getElementById('monthSubtitle');
    const monthlyTotalWeeks = document.getElementById('monthlyTotalWeeks');
    const monthlyBudget = document.getElementById('monthlyBudget');
    const monthlyRemaining = document.getElementById('monthlyRemaining');
    const monthlyDetailsTableBody = document.getElementById('monthlyDetailsTableBody');
    
    if (monthDateRange) monthDateRange.textContent = '';
    if (monthSubtitle) monthSubtitle.textContent = '';
    if (monthlyTotalWeeks) monthlyTotalWeeks.textContent = '-';
    if (monthlyBudget) monthlyBudget.textContent = '-';
    if (monthlyRemaining) monthlyRemaining.textContent = '-';
    if (monthlyDetailsTableBody) monthlyDetailsTableBody.innerHTML = '';

    // Also clear any loading or error messages specific to monthly
    const loadingMessages = document.querySelectorAll('.monthly-loading');
    loadingMessages.forEach(msg => msg.remove());
    const errorCells = document.querySelectorAll('#monthlyDetailsTableBody .error-data');
    errorCells.forEach(cell => cell.parentElement?.remove());
}

// Initialize monthly expense functionality
export function initializeMonthly() {
    // Add event listeners
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const addMonthlyExpenseBtn = document.getElementById('addMonthlyExpenseBtn');
    
    prevMonthBtn?.addEventListener('click', () => {
        if (!prevMonthBtn.disabled) {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            loadMonthlyData();
        }
    });
    
    nextMonthBtn?.addEventListener('click', () => {
        if (!nextMonthBtn.disabled) {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            loadMonthlyData();
        }
    });
    
    addMonthlyExpenseBtn?.addEventListener('click', () => {
        // Use the same modal but with monthly context
        document.getElementById('modalTitle').textContent = 'Tambah Pengeluaran Bulanan';
        window.showModal('monthly');
    });
    
    // Hide navigation buttons by default (feature not ready yet)
    if (prevMonthBtn) prevMonthBtn.style.display = 'none';
    if (nextMonthBtn) nextMonthBtn.style.display = 'none';
    
    // Tab changes are handled centrally in main.js
}

// Update month display
function updateMonthDisplay(data) {
    if (!data) return;
    
    const monthDateRange = document.getElementById('monthDateRange');
    const monthSubtitle = document.getElementById('monthSubtitle');
    
    if (monthDateRange && data.month_label && data.year) {
        monthDateRange.textContent = `${data.month_label} ${data.year}`;
    }
    
    if (monthSubtitle && data.date_range) {
        monthSubtitle.textContent = data.date_range;
    }
}

// Function to show loading state for monthly tab
function showMonthlyLoadingState() {
    // Remove any existing loading messages first
    hideMonthlyLoadingState();
    
    const monthlyTab = document.getElementById('monthlyTab');
    if (!monthlyTab) return;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message monthly-loading';
    loadingDiv.innerHTML = `
        <h3>📅 Loading Monthly Data</h3>
        <p>Fetching monthly expense data from server...</p>
        <div class="loading-spinner">
            <div class="spinner"></div>
        </div>
    `;
    
    // Insert loading message at the top of the monthly tab
    monthlyTab.insertBefore(loadingDiv, monthlyTab.firstChild);
}

// Function to hide loading state for monthly tab
function hideMonthlyLoadingState() {
    const loadingMessages = document.querySelectorAll('.monthly-loading');
    loadingMessages.forEach(msg => msg.remove());
}

// Load monthly data
export async function loadMonthlyData() {
    try {
        // Show loading state
        showMonthlyLoadingState();
        
        const response = await fetch(config.getMonthlyExpenseUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(config.timeout)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Store the monthly data
        monthlyData = data;
        
        // Remove loading state and update displays with real data
        hideMonthlyLoadingState();
        updateMonthDisplay(data);
        updateMonthlyDisplay(data);
        updateMonthlyDetailsTable(data.remaining?.details || []);
        
    } catch (error) {
        console.error('Failed to fetch monthly data:', error);
        hideMonthlyLoadingState();
        showMonthlyError(error.message);
    }
}

// Update monthly display
function updateMonthlyDisplay(data) {
    if (!data) return;
    
    // Update info grid with the required information
    const totalWeeksElement = document.getElementById('monthlyTotalWeeks');
    const budgetElement = document.getElementById('monthlyBudget');
    const remainingElement = document.getElementById('monthlyRemaining');
    
    if (totalWeeksElement && data.total_weeks) {
        totalWeeksElement.textContent = data.total_weeks;
    }
    
    if (budgetElement && data.budget) {
        budgetElement.textContent = data.budget;
    }
    
    if (remainingElement && data.remaining?.total?.label) {
        remainingElement.textContent = data.remaining.total.label;
        
        // You can add color coding based on remaining amount if needed
        // For now, keeping it simple since the amount is already formatted
    }
}

// Update navigation button states
function updateNavigationButtons(navigation) {
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    
    // Temporarily hide navigation buttons (feature not ready yet)
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    
    /* Future implementation when navigation is ready:
    prevBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
    
    if (navigation) {
        // Update previous month button
        if (!navigation.hasPreviousMonth) {
            prevBtn.disabled = true;
            prevBtn.title = 'Tidak ada bulan sebelumnya';
        } else {
            prevBtn.disabled = false;
            prevBtn.title = '';
        }
        
        // Update next month button
        if (!navigation.hasNextMonth) {
            nextBtn.disabled = true;
            nextBtn.title = 'Tidak ada bulan selanjutnya';
        } else {
            nextBtn.disabled = false;
            nextBtn.title = '';
        }
    }
    */
}

// Update monthly details table
function updateMonthlyDetailsTable(details) {
    const tableBody = document.getElementById('monthlyDetailsTableBody');
    
    if (!details || details.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="no-data">Tidak ada detail pengeluaran bulanan</td>
            </tr>
        `;
        return;
    }
    
    // Group details by date
    const groupedDetails = groupDetailsByDate(details);
    
    let htmlContent = '';
    
    Object.keys(groupedDetails).forEach(dateKey => {
        const dayDetails = groupedDetails[dateKey];
        const dateObj = new Date(dayDetails[0].time);
        const dayName = dateObj.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
        });
        
        // Add day header
        htmlContent += `
            <tr class="day-header">
                <td colspan="3" class="day-header-cell">${dayName}</td>
            </tr>
        `;
        
        // Add details for this day
        dayDetails.forEach(detail => {
            const timeObj = new Date(detail.time);
            const timeString = timeObj.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            
            // Check if amount is negative to apply green color
            const isNegative = detail.amount && detail.amount.includes('-');
            const amountClass = isNegative ? 'detail-amount negative' : 'detail-amount';
            
            htmlContent += `
                <tr class="detail-row-clickable" data-detail='${JSON.stringify(detail)}'>
                    <td class="detail-time">${timeString}</td>
                    <td class="detail-type">${detail.type || '-'}</td>
                    <td class="${amountClass}">${detail.amount || '-'}</td>
                </tr>
            `;
        });
    });
    
    tableBody.innerHTML = htmlContent;
    
    // Add click handlers for detail rows
    tableBody.querySelectorAll('.detail-row-clickable').forEach(row => {
        row.addEventListener('click', () => {
            const detail = JSON.parse(row.getAttribute('data-detail'));
            window.showDetailModal(detail);
        });
    });
}

// Group details by date
function groupDetailsByDate(details) {
    const grouped = {};
    
    details.forEach(detail => {
        const date = new Date(detail.time);
        const dateKey = date.toDateString();
        
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        
        grouped[dateKey].push(detail);
    });
    
    return grouped;
}

// Show monthly error
function showMonthlyError(message) {
    const detailsBody = document.getElementById('monthlyDetailsTableBody');
    detailsBody.innerHTML = `
        <tr>
            <td colspan="3" class="error-data">
                <span class="error-icon">⚠️</span>
                Error: ${message}
            </td>
        </tr>
    `;
}

// Add monthly expense
export async function addMonthlyExpense(expenseData) {
    try {
        const response = await fetch(config.addMonthlyExpenseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...expenseData,
                month: currentMonth.getMonth(),
                year: currentMonth.getFullYear()
            }),
            signal: AbortSignal.timeout(config.timeout)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Reload monthly data after successful addition
        await loadMonthlyData();
        
        return true;
    } catch (error) {
        console.error('Failed to add monthly expense:', error);
        throw error;
    }
}

// Get current month data
export function getCurrentMonthData() {
    return monthlyData;
}
