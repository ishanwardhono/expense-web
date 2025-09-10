// Recap functionality
let currentRecapData = null;
let recapDataHistory = []; // Store all loaded recap data
let recapConfig = null; // Store configuration

// Function to reset recap data
export function resetRecapData() {
    currentRecapData = null;
    recapDataHistory = [];
    
    // Clear the display elements
    const recapTablesContainer = document.getElementById('recapTablesContainer');
    const recapNavigation = document.getElementById('recapNavigation');
    
    if (recapTablesContainer) {
        recapTablesContainer.innerHTML = '';
    }
    if (recapNavigation) {
        recapNavigation.style.display = 'none';
    }
}

// Initialize recap functionality
export function initializeRecap(config) {
    recapConfig = config; // Store config for later use
    
    // Listen for tab changes
    document.addEventListener('tabChanged', (event) => {
        if (event.detail.tab === 'recap') {
            // Reset history and load fresh data when switching to recap tab
            recapDataHistory = [];
            clearAllRecapCards();
            loadRecapData();
        }
    });

    // Previous month button
    const prevRecapBtn = document.getElementById('prevRecapBtn');
    if (prevRecapBtn) {
        prevRecapBtn.addEventListener('click', loadPreviousMonth);
    }
}

// Function to show loading state for recap tab
function showRecapLoadingState() {
    // Remove any existing loading messages first
    hideRecapLoadingState();
    
    const recapTablesContainer = document.getElementById('recapTablesContainer');
    if (!recapTablesContainer) return;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message recap-loading';
    loadingDiv.innerHTML = `
        <h3>📊 Loading Recap Data</h3>
        <p>Fetching recap data from server...</p>
        <div class="loading-spinner">
            <div class="spinner"></div>
        </div>
    `;
    
    // Insert loading message in the recap container
    recapTablesContainer.appendChild(loadingDiv);
}

// Function to hide loading state for recap tab
function hideRecapLoadingState() {
    const loadingMessages = document.querySelectorAll('.recap-loading');
    loadingMessages.forEach(msg => msg.remove());
}

// Function to show loading state for additional recap data (for previous months)
function showRecapAdditionalLoadingState() {
    // Remove any existing additional loading messages first
    hideRecapAdditionalLoadingState();
    
    // Hide the previous month button during loading
    const prevBtn = document.getElementById('prevRecapBtn');
    if (prevBtn) {
        prevBtn.style.display = 'none';
    }
    
    const recapTablesContainer = document.getElementById('recapTablesContainer');
    if (!recapTablesContainer) return;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message recap-additional-loading';
    loadingDiv.innerHTML = `
        <h3>📊 Loading Previous Month</h3>
        <p>Fetching additional recap data...</p>
        <div class="loading-spinner">
            <div class="spinner"></div>
        </div>
    `;
    
    // Append loading message to the recap container
    recapTablesContainer.appendChild(loadingDiv);
}

// Function to hide additional loading state for recap tab
function hideRecapAdditionalLoadingState() {
    const loadingMessages = document.querySelectorAll('.recap-additional-loading');
    loadingMessages.forEach(msg => msg.remove());
}

// Load recap data from API
async function loadRecapData(requestBody = {}) {
    try {
        // Show loading state - different for initial vs additional loads
        if (recapDataHistory.length === 0) {
            showRecapLoadingState();
        } else {
            showRecapAdditionalLoadingState();
        }
        
        const response = await fetch(recapConfig.getRecapUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recap data');
        }

        const data = await response.json();
        currentRecapData = data;
        
        // Remove loading state
        hideRecapLoadingState();
        hideRecapAdditionalLoadingState();
        
        // Add to history
        recapDataHistory.push(data);
        
        // Add new card for this data
        addNewRecapCard(data);
        
        // Update global navigation button
        updateGlobalNavigation(data);
        
    } catch (error) {
        console.error('Error loading recap data:', error);
        hideRecapLoadingState();
        hideRecapAdditionalLoadingState();
        
        // Show the button again in case of error (if there was previous data)
        if (recapDataHistory.length > 0 && currentRecapData && currentRecapData.prev_month) {
            const prevBtn = document.getElementById('prevRecapBtn');
            if (prevBtn) {
                prevBtn.style.display = 'block';
            }
        }
        
        renderErrorState();
    }
}

// Load previous month data
function loadPreviousMonth() {
    if (currentRecapData && currentRecapData.prev_month) {
        const requestBody = {
            Month: currentRecapData.prev_month.Month,
            Year: currentRecapData.prev_month.Year
        };
        loadRecapData(requestBody);
    }
}

// Clear all recap cards
function clearAllRecapCards() {
    const container = document.getElementById('recapTablesContainer');
    if (container) {
        container.innerHTML = '';
    }
    
    // Also hide navigation
    const navigation = document.getElementById('recapNavigation');
    if (navigation) {
        navigation.style.display = 'none';
    }
}

// Add new recap card
function addNewRecapCard(data) {
    const container = document.getElementById('recapTablesContainer');
    if (!container) return;

    // Create new card wrapper
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'recap-card';

    // Create header
    const header = document.createElement('div');
    header.className = 'recap-header';
    const title = document.createElement('h2');
    title.textContent = data.date_label || 'No Data';
    header.appendChild(title);

    // Create table wrapper
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'recap-table';

    // Create table
    const table = document.createElement('table');
    table.className = 'recap-details-table';

    // Create tbody
    const tbody = document.createElement('tbody');

    // Add detail rows
    if (data.details && data.details.length > 0) {
        data.details.forEach(detail => {
            const row = document.createElement('tr');
            
            // Description column
            const descCell = document.createElement('td');
            descCell.className = 'recap-description';
            descCell.textContent = detail.description;
            row.appendChild(descCell);

            // Amount column
            const amountCell = document.createElement('td');
            amountCell.className = 'recap-amount';
            amountCell.textContent = detail.amount;
            row.appendChild(amountCell);

            // Remaining column
            const remainingCell = document.createElement('td');
            remainingCell.className = 'recap-remaining';
            remainingCell.textContent = detail.remaining.label;
            
            // Apply color based on label_color
            if (detail.remaining.label_color) {
                remainingCell.classList.add(detail.remaining.label_color);
            }
            
            row.appendChild(remainingCell);
            tbody.appendChild(row);
        });
    }

    // Add total row
    const totalRow = document.createElement('tr');
    totalRow.className = 'recap-total-row';

    const totalDescCell = document.createElement('td');
    totalDescCell.className = 'recap-description recap-total-cell';
    totalDescCell.textContent = 'Total';
    totalRow.appendChild(totalDescCell);

    const totalAmountCell = document.createElement('td');
    totalAmountCell.className = 'recap-amount recap-total-cell';
    totalAmountCell.textContent = data.expense || '-';
    totalRow.appendChild(totalAmountCell);

    const totalRemainingCell = document.createElement('td');
    totalRemainingCell.className = 'recap-remaining recap-total-cell';
    totalRemainingCell.textContent = data.remaining ? data.remaining.label : '-';
    
    // Apply color for total remaining
    if (data.remaining && data.remaining.label_color) {
        totalRemainingCell.classList.add(data.remaining.label_color);
    }
    
    totalRow.appendChild(totalRemainingCell);
    tbody.appendChild(totalRow);

    // Assemble table
    table.appendChild(tbody);
    tableWrapper.appendChild(table);

    // Assemble card (no individual button)
    cardWrapper.appendChild(header);
    cardWrapper.appendChild(tableWrapper);
    
    container.appendChild(cardWrapper);
}

// Update global navigation button
function updateGlobalNavigation(data) {
    const navigation = document.getElementById('recapNavigation');
    const prevBtn = document.getElementById('prevRecapBtn');
    
    if (navigation && prevBtn) {
        if (data.prev_month) {
            navigation.style.display = 'block';
            prevBtn.style.display = 'block'; // Show button when data has previous month
        } else {
            navigation.style.display = 'none';
            prevBtn.style.display = 'none'; // Hide button when no previous month
        }
    }
}

// Render error state
function renderErrorState() {
    const container = document.getElementById('recapTablesContainer');
    if (container) {
        container.innerHTML = `
            <div class="recap-card">
                <div class="recap-header">
                    <h2>Error Loading Data</h2>
                </div>
                <div class="recap-table">
                    <table class="recap-details-table">
                        <tbody>
                            <tr>
                                <td colspan="3" style="text-align: center; padding: 40px; color: #666;">
                                    Failed to load recap data. Please try again.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // Hide navigation on error
    const navigation = document.getElementById('recapNavigation');
    if (navigation) {
        navigation.style.display = 'none';
    }
}
