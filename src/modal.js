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
    
    // Initialize roll number picker
    initializeRollPicker();
    
    // Initialize input toggle
    initializeInputToggle();
    
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
    
    // Focus on appropriate input based on mode
    setTimeout(() => {
        if (isRollMode) {
            // For roll mode, we don't need to focus on anything specific
            // The roll picker is always ready for interaction
        } else {
            document.getElementById('normalAmountInput').focus();
        }
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
    
    form.reset();
    
    // Reset date toggle to disabled state
    dateToggle.checked = false;
    dateInput.disabled = true;
    dateInput.value = '';
    
    // Remove any error states
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
    
    // Reset both input types
    resetRollPicker();
    resetNormalInput();
    
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

// Roll Number Picker Functions
let currentValue = 0;
let isNegative = false;

function initializeRollPicker() {
    const picker = document.getElementById('rollNumberPicker');
    const clearBtn = document.getElementById('rollClearBtn');
    const negateBtn = document.getElementById('rollNegateBtn');
    
    // Initialize digit buttons
    const digits = picker.querySelectorAll('.roll-digit');
    digits.forEach(digit => {
        const position = parseInt(digit.dataset.position);
        const upBtn = digit.querySelector('.roll-btn-up');
        const downBtn = digit.querySelector('.roll-btn-down');
        const display = digit.querySelector('.roll-display');
        
        // Up button functionality
        upBtn.addEventListener('click', () => {
            incrementDigit(position);
            animateDigitChange(display);
        });
        
        // Down button functionality  
        downBtn.addEventListener('click', () => {
            decrementDigit(position);
            animateDigitChange(display);
        });
    });
    
    // Clear button
    clearBtn.addEventListener('click', () => {
        clearRollPicker();
    });
    
    // Negate button (+/-)
    negateBtn.addEventListener('click', () => {
        toggleNegative();
    });
    
    // Initialize display
    updateRollDisplay();
}

function incrementDigit(position) {
    const digitValue = Math.floor(Math.abs(currentValue) / Math.pow(10, position)) % 10;
    const increment = Math.pow(10, position);
    
    if (digitValue === 9) {
        // If digit is 9, set it to 0 and carry over
        currentValue = currentValue - (9 * increment);
    } else {
        // Normal increment
        currentValue = isNegative ? currentValue - increment : currentValue + increment;
    }
    
    updateRollDisplay();
    updateHiddenInput();
}

function decrementDigit(position) {
    const digitValue = Math.floor(Math.abs(currentValue) / Math.pow(10, position)) % 10;
    const decrement = Math.pow(10, position);
    
    if (digitValue === 0) {
        // If digit is 0, set it to 9 and borrow
        currentValue = currentValue + (9 * decrement);
    } else {
        // Normal decrement
        currentValue = isNegative ? currentValue + decrement : currentValue - decrement;
    }
    
    updateRollDisplay();
    updateHiddenInput();
}

function updateRollDisplay() {
    const absValue = Math.abs(currentValue);
    const picker = document.getElementById('rollNumberPicker');
    const container = document.querySelector('.roll-picker-container');
    const digits = picker.querySelectorAll('.roll-digit');
    
    // Update negative class on both picker and container
    const isNeg = isNegative && currentValue !== 0;
    picker.classList.toggle('negative', isNeg);
    container.classList.toggle('negative', isNeg);
    
    digits.forEach(digit => {
        const position = parseInt(digit.dataset.position);
        const display = digit.querySelector('.roll-display');
        const digitValue = Math.floor(absValue / Math.pow(10, position)) % 10;
        
        display.textContent = digitValue;
    });
}

function animateDigitChange(display) {
    display.classList.add('changed');
    setTimeout(() => {
        display.classList.remove('changed');
    }, 300);
}

function clearRollPicker() {
    currentValue = 0;
    isNegative = false;
    updateRollDisplay();
    updateHiddenInput();
    
    // Animate all digits
    const displays = document.querySelectorAll('.roll-display');
    displays.forEach(display => {
        animateDigitChange(display);
    });
}

function toggleNegative() {
    if (currentValue !== 0) {
        isNegative = !isNegative;
        currentValue = -currentValue;
        updateRollDisplay();
        updateHiddenInput();
    }
}

function updateHiddenInput() {
    const hiddenInput = document.getElementById('expenseAmount');
    hiddenInput.value = currentValue.toString();
}

function resetRollPicker() {
    currentValue = 0;
    isNegative = false;
    updateRollDisplay();
    updateHiddenInput();
}

// Input Toggle Functions
let isRollMode = true;

function initializeInputToggle() {
    const toggle = document.getElementById('inputToggle');
    const rollContainer = document.getElementById('rollPickerContainer');
    const normalContainer = document.getElementById('normalInputContainer');
    const normalInput = document.getElementById('normalAmountInput');
    
    // Set initial state (Roll mode by default)
    toggle.checked = true;
    isRollMode = true;
    
    // Toggle event
    toggle.addEventListener('change', () => {
        isRollMode = toggle.checked;
        
        if (isRollMode) {
            // Switch to Roll mode
            rollContainer.style.display = 'block';
            normalContainer.style.display = 'none';
            
            // Transfer value from normal to roll
            const normalValue = parseInt(normalInput.value) || 0;
            setRollPickerValue(normalValue);
            
        } else {
            // Switch to Normal mode
            rollContainer.style.display = 'none';
            normalContainer.style.display = 'block';
            
            // Transfer value from roll to normal
            normalInput.value = currentValue;
            updateHiddenInputFromNormal();
            
            // Focus on normal input
            setTimeout(() => normalInput.focus(), 100);
        }
    });
    
    // Normal input change event
    normalInput.addEventListener('input', () => {
        if (!isRollMode) {
            updateHiddenInputFromNormal();
        }
    });
}

function setRollPickerValue(value) {
    currentValue = Math.abs(value);
    isNegative = value < 0;
    updateRollDisplay();
    updateHiddenInput();
}

function updateHiddenInputFromNormal() {
    const normalInput = document.getElementById('normalAmountInput');
    const hiddenInput = document.getElementById('expenseAmount');
    const value = parseInt(normalInput.value) || 0;
    hiddenInput.value = value.toString();
}

function resetNormalInput() {
    const normalInput = document.getElementById('normalAmountInput');
    normalInput.value = '';
    if (!isRollMode) {
        updateHiddenInputFromNormal();
    }
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
    
    console.log(`Date picker limited to current week: ${mondayStr} to ${sundayStr}`);
}
