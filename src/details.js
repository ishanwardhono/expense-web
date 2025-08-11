// Details table and modal management functions

// Initialize details section
export function initializeDetails() {
    const detailModal = document.getElementById('expenseDetailModal');
    const closeDetailBtn = document.getElementById('closeDetailModal');
    
    // Close detail modal handlers
    closeDetailBtn.addEventListener('click', () => {
        hideDetailModal();
    });
    
    // Close modal when clicking outside
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            hideDetailModal();
        }
    });
    
    // Handle ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && detailModal.classList.contains('show')) {
            hideDetailModal();
        }
    });
}

// Show detail modal
export function showDetailModal(detail) {
    const modal = document.getElementById('expenseDetailModal');
    
    // Format the time to show only time without date
    const timeObj = new Date(detail.time);
    const timeString = timeObj.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    
    // Format the full date and time for display
    const fullDateTime = timeObj.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    // Populate modal with detail information
    document.getElementById('detailTime').textContent = fullDateTime;
    document.getElementById('detailType').textContent = detail.type || '-';
    document.getElementById('detailAmount').textContent = detail.amount || '-';
    document.getElementById('detailNote').textContent = detail.note || 'Tidak ada catatan';
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Hide detail modal
export function hideDetailModal() {
    const modal = document.getElementById('expenseDetailModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Populate details table
export function populateDetailsTable(details) {
    const tableBody = document.getElementById('detailsTableBody');
    
    if (!details || details.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="no-data">Tidak ada detail pengeluaran</td>
            </tr>
        `;
        return;
    }
    
    // Group details by day
    const groupedDetails = groupDetailsByDay(details);
    
    // Generate HTML for grouped details
    let htmlContent = '';
    
    Object.keys(groupedDetails).forEach(dayName => {
        const dayDetails = groupedDetails[dayName];
        
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
    
    // Add click handlers to detail rows
    const detailRows = tableBody.querySelectorAll('.detail-row-clickable');
    detailRows.forEach(row => {
        row.addEventListener('click', () => {
            const detailData = JSON.parse(row.dataset.detail);
            showDetailModal(detailData);
        });
    });
}

// Helper function to get day name in Indonesian
function getDayName(dayIndex) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dayIndex] || '-';
}

// Helper function to group details by day
function groupDetailsByDay(details) {
    const grouped = {};
    
    details.forEach(detail => {
        const dateObj = new Date(detail.time);
        const dayName = getDayName(dateObj.getDay());
        
        if (!grouped[dayName]) {
            grouped[dayName] = [];
        }
        
        grouped[dayName].push(detail);
    });
    
    // Sort each day's details by time (oldest first within each day)
    Object.keys(grouped).forEach(dayName => {
        grouped[dayName].sort((a, b) => {
            return new Date(a.time) - new Date(b.time);
        });
    });
    
    // Return grouped details in day order (Monday to Sunday)
    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const orderedGrouped = {};
    
    dayOrder.forEach(dayName => {
        if (grouped[dayName]) {
            orderedGrouped[dayName] = grouped[dayName];
        }
    });
    
    return orderedGrouped;
}
