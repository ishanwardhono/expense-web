// Modal and Form Management Functions
export function initializeModal(config, refreshData) {
    const modal = document.getElementById('addExpenseModal');
    const addBtn = document.getElementById('addExpenseBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('addExpenseForm');
    const dateInput = document.getElementById('expenseDate');
    
    // Set date input as disabled by default
    dateInput.disabled = true;
    
    // Initialize amount input with negative toggle
    initializeAmountInput();
    
    // Initialize date picker toggle
    initializeDateToggle();
    
    // Show modal
    addBtn.addEventListener('click', () => {
        showModal();
    });
    
    // Hide modal
    closeBtn.addEventListener('click', () => {
        hideModal();
    });
    
    cancelBtn.addEventListener('click', () => {
        hideModal();
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
    
    // Handle form submission
    form.addEventListener('submit', (e) => handleExpenseSubmit(e, config, refreshData));
    
    // Handle ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            hideModal();
        }
    });
}

export function showModal() {
    const modal = document.getElementById('addExpenseModal');
    modal.classList.add('show');
    
    // Focus on amount input
    setTimeout(() => {
        document.getElementById('expenseAmount').focus();
    }, 100);
}

export function hideModal() {
    const modal = document.getElementById('addExpenseModal');
    modal.classList.remove('show');
    resetForm();
}

function resetForm() {
    const form = document.getElementById('addExpenseForm');
    const dateInput = document.getElementById('expenseDate');
    const dateToggle = document.getElementById('dateToggle');
    const amountInput = document.getElementById('expenseAmount');
    
    form.reset();
    
    // Reset date toggle to disabled state
    dateToggle.checked = false;
    dateInput.disabled = true;
    dateInput.value = '';
    
    // Clear amount input
    amountInput.value = '';
    
    // Remove any error states
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
    
    // Hide error section
    hideModalError();
}

async function handleExpenseSubmit(e, config, refreshData) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const amountInput = document.getElementById('expenseAmount');
    const dateInput = document.getElementById('expenseDate');
    const submitBtn = document.getElementById('submitBtn');
    
    // Get form values
    const amount = parseInt(formData.get('amount'));
    const selectedDate = formData.get('date');
    const dateToggle = document.getElementById('dateToggle');
    const today = new Date().toISOString().split('T')[0];
    
    // Validate amount - only prevent exactly 0
    if (amount === 0) {
        showModalError('Jumlah tidak boleh 0');
        return;
    }
    
    // Check if amount is a valid number
    if (isNaN(amount)) {
        showModalError('Jumlah harus berupa angka yang valid');
        return;
    }
    
    // Prepare data for API
    // If date toggle is off or date input is disabled, send null for date (use today)
    // If date toggle is on and a date is selected, use that date
    let dateToSend = null;
    if (dateToggle.checked && !dateInput.disabled && selectedDate) {
        // Only send date if it's different from today
        dateToSend = selectedDate === today ? null : selectedDate;
    }
    
    const requestData = {
        amount: amount,
        date: dateToSend
    };
    
    try {
        // Hide any existing errors
        hideModalError();
        
        // Show loading state on button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
        
        await addExpense(requestData, config);
        
        // Success - close modal and refresh data
        hideModal();
        await refreshData();
        
        // Show success message
        showSuccessMessage('Pengeluaran berhasil ditambahkan!');
        
    } catch (error) {
        console.error('Error adding expense:', error);
        showModalError(error.message || 'Gagal menambahkan pengeluaran');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan';
    }
}

export async function addExpense(data, config) {
    try {
        const response = await fetch(config.addWeeklyExpenseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(config.timeout)
        });
        
        if (!response.ok) {
            // Handle specific HTTP status codes
            if (response.status === 400) {
                throw new Error('Data yang dikirim tidak valid. Periksa kembali jumlah dan tanggal.');
            } else if (response.status === 401) {
                throw new Error('Tidak memiliki akses untuk menambah pengeluaran.');
            } else if (response.status === 403) {
                throw new Error('Akses ditolak. Anda tidak memiliki izin untuk operasi ini.');
            } else if (response.status === 404) {
                throw new Error('Server tidak ditemukan. Periksa konfigurasi URL.');
            } else if (response.status === 422) {
                throw new Error('Data tidak dapat diproses. Periksa format tanggal dan jumlah.');
            } else if (response.status >= 500) {
                throw new Error('Terjadi kesalahan pada server. Silakan coba lagi nanti.');
            } else {
                throw new Error(`Kesalahan HTTP: ${response.status} - ${response.statusText}`);
            }
        }
        
        return await response.json();
    } catch (error) {
        console.error('Failed to add expense:', error);
        
        // Handle different types of errors with user-friendly messages
        if (error.name === 'AbortError') {
            throw new Error('Koneksi timeout. Pastikan server sedang berjalan dan coba lagi.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet dan pastikan server berjalan.');
        } else if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
            throw new Error('Terjadi masalah jaringan. Ini mungkin masalah CORS atau koneksi.');
        } else if (error.message.includes('JSON')) {
            throw new Error('Terjadi kesalahan dalam memproses data. Silakan coba lagi.');
        } else if (error.message.startsWith('Data yang dikirim') || 
                   error.message.startsWith('Tidak memiliki akses') ||
                   error.message.startsWith('Akses ditolak') ||
                   error.message.startsWith('Server tidak ditemukan') ||
                   error.message.startsWith('Data tidak dapat diproses') ||
                   error.message.startsWith('Terjadi kesalahan pada server') ||
                   error.message.startsWith('Kesalahan HTTP')) {
            // These are already user-friendly messages from HTTP status handling
            throw error;
        } else {
            // Generic fallback for unknown errors
            throw new Error('Terjadi kesalahan yang tidak diketahui. Silakan coba lagi atau hubungi administrator.');
        }
    }
}

function showModalError(message) {
    const errorSection = document.getElementById('modalErrorSection');
    const errorMessage = document.getElementById('modalErrorMessage');
    
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    
    // Scroll to top of modal to show error
    const modalBody = document.querySelector('.modal-body');
    modalBody.scrollTop = 0;
}

function hideModalError() {
    const errorSection = document.getElementById('modalErrorSection');
    errorSection.style.display = 'none';
}

function showSuccessMessage(message) {
    // Remove any existing success messages
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <h3>✅ Berhasil</h3>
        <p>${message}</p>
    `;
    
    // Insert success message at the top of the body
    document.body.insertBefore(successDiv, document.body.firstChild);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

// Amount Input Functions
function initializeAmountInput() {
    const amountInput = document.getElementById('expenseAmount');
    const negateBtn = document.getElementById('negateBtn');
    
    // Handle negate button click
    negateBtn.addEventListener('click', () => {
        const currentValue = parseInt(amountInput.value) || 0;
        amountInput.value = (-currentValue).toString();
    });
    
    // Ensure value is always a valid number when not empty
    amountInput.addEventListener('input', () => {
        const value = amountInput.value;
        if (value !== '' && isNaN(parseInt(value))) {
            amountInput.value = '';
        }
    });
}

// Date picker toggle functionality
function initializeDateToggle() {
    const dateToggle = document.getElementById('dateToggle');
    const dateInput = document.getElementById('expenseDate');
    
    // Set initial state (disabled by default)
    dateToggle.checked = false;
    dateInput.disabled = true;
    
    // Toggle event
    dateToggle.addEventListener('change', () => {
        if (dateToggle.checked) {
            // Enable date picker
            dateInput.disabled = false;
            setWeekDateRange();
        } else {
            // Disable date picker
            dateInput.disabled = true;
            dateInput.value = '';
        }
    });
}

// Calculate and set date range for the current week
function setWeekDateRange() {
    const dateInput = document.getElementById('expenseDate');
    
    // Get current date
    const currentDate = new Date();
    
    // Get the Monday of the current week (ISO week starts on Monday)
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysUntilMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday as 0
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + daysUntilMonday);
    
    // Get the Sunday of the current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // Format dates as YYYY-MM-DD
    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = sunday.toISOString().split('T')[0];
    
    // Set the date picker constraints
    dateInput.min = mondayStr;
    dateInput.max = sundayStr;
    
    // Set default value to today if it's within the current week
    const todayStr = currentDate.toISOString().split('T')[0];
    if (todayStr >= mondayStr && todayStr <= sundayStr) {
        dateInput.value = todayStr;
    } else {
        // If somehow today is not in the current week range, set to Monday
        dateInput.value = mondayStr;
    }
}
