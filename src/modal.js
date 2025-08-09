// Modal and Form Management Functions
export function initializeModal(config, refreshData) {
    const modal = document.getElementById('addExpenseModal');
    const addBtn = document.getElementById('addExpenseBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('addExpenseForm');
    const dateInput = document.getElementById('expenseDate');
    
    // Set date input as disabled by default and show current time
    dateInput.disabled = true;
    setCurrentDateTime();
    
    // Initialize amount input with negative toggle
    initializeAmountInput();
    
    // Initialize date picker toggle
    initializeDateToggle();
    
    // Initialize textarea auto-resize
    initializeTextareaResize();
    
    // Initialize datetime clear button override
    initializeDateTimeClearOverride();
    
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
    const typeSelect = document.getElementById('expenseType');
    const noteTextarea = document.getElementById('expenseNote');
    
    form.reset();
    
    // Reset date toggle to disabled state
    dateToggle.checked = false;
    dateInput.disabled = true;
    setCurrentDateTime();
    
    // Clear amount input
    amountInput.value = '';
    
    // Reset type to default (Konsumsi)
    typeSelect.value = 'Konsumsi';
    
    // Clear note textarea
    noteTextarea.value = '';
    noteTextarea.style.height = '60px'; // Reset height to default
    noteTextarea.style.minHeight = '60px'; // Reset min-height to default
    
    // Remove any error states
    const inputs = form.querySelectorAll('input, select, textarea');
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
    const expenseType = formData.get('type') || 'Konsumsi';
    const expenseNote = formData.get('note') || '';
    const dateToggle = document.getElementById('dateToggle');
    const today = new Date();
    
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
        // Format the datetime-local value to match Go's expected format: "2006-01-02 15:04:05"
        const dateObj = new Date(selectedDate);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        
        dateToSend = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        
        // Only send date if it's different from today (comparing just the date part)
        const todayStr = today.toISOString().split('T')[0];
        const selectedDateStr = selectedDate.split('T')[0];
        if (selectedDateStr === todayStr && hours === '00' && minutes === '00') {
            dateToSend = null; // Use server's current time
        }
    }
    
    const requestData = {
        amount: amount,
        date: dateToSend,
        type: expenseType,
        note: expenseNote
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
            // Disable date picker and set current time
            dateInput.disabled = true;
            setCurrentDateTime();
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
    monday.setHours(0, 0, 0, 0); // Start of Monday
    
    // Get the Sunday of the current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999); // End of Sunday
    
    // Format dates for datetime-local input (YYYY-MM-DDTHH:MM)
    const formatDatetimeLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    const mondayStr = formatDatetimeLocal(monday);
    const sundayStr = formatDatetimeLocal(sunday);
    
    // Set the datetime picker constraints
    dateInput.min = mondayStr;
    dateInput.max = sundayStr;
    
    // Set default value to current time if it's within the current week
    const now = new Date();
    if (now >= monday && now <= sunday) {
        dateInput.value = formatDatetimeLocal(now);
    } else {
        // If somehow current time is not in the current week range, set to Monday
        dateInput.value = mondayStr;
    }
}

// Initialize textarea auto-resize functionality
function initializeTextareaResize() {
    const noteTextarea = document.getElementById('expenseNote');
    
    // Function to auto-resize textarea
    function autoResize() {
        noteTextarea.style.height = 'auto';
        noteTextarea.style.height = noteTextarea.scrollHeight + 'px';
    }
    
    // Add event listeners for textarea resize
    noteTextarea.addEventListener('input', autoResize);
    noteTextarea.addEventListener('focus', () => {
        // Expand slightly when focused if empty
        if (!noteTextarea.value) {
            noteTextarea.style.minHeight = '100px';
        }
        autoResize();
    });
    noteTextarea.addEventListener('blur', () => {
        // Reset min-height when losing focus if empty
        if (!noteTextarea.value) {
            noteTextarea.style.minHeight = '60px';
            noteTextarea.style.height = '60px'; // Force reset height
        }
    });
}

// Set current date and time to the datetime input
function setCurrentDateTime() {
    const dateInput = document.getElementById('expenseDate');
    const now = new Date();
    
    // Format datetime for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    dateInput.value = formattedDateTime;
}

// Override the clear button behavior to set current date/time instead
function initializeDateTimeClearOverride() {
    const dateInput = document.getElementById('expenseDate');
    
    // Listen for input changes that result in empty value (clear button click)
    dateInput.addEventListener('input', (e) => {
        if (e.target.value === '' && !dateInput.disabled) {
            // If the input was cleared and it's enabled, set current time instead
            setTimeout(() => {
                setCurrentDateTime();
            }, 0);
        }
    });
    
    // Also listen for change events
    dateInput.addEventListener('change', (e) => {
        if (e.target.value === '' && !dateInput.disabled) {
            // If the input was cleared and it's enabled, set current time instead
            setCurrentDateTime();
        }
    });
}
