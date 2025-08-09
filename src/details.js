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
    
    // Sort details by time (newest first)
    const sortedDetails = [...details].sort((a, b) => {
        return new Date(b.time) - new Date(a.time);
    });
    
    tableBody.innerHTML = sortedDetails.map(detail => {
        // Format time to show only time without date
        const timeObj = new Date(detail.time);
        const timeString = timeObj.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        
        // Check if amount is negative to apply green color
        const isNegative = detail.amount && detail.amount.includes('-');
        const amountClass = isNegative ? 'detail-amount negative' : 'detail-amount';
        
        return `
            <tr class="detail-row-clickable" data-detail='${JSON.stringify(detail)}'>
                <td class="detail-time">${timeString}</td>
                <td class="detail-type">${detail.type || '-'}</td>
                <td class="${amountClass}">${detail.amount || '-'}</td>
            </tr>
        `;
    }).join('');
    
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
