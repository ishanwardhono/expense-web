// Tab management functionality

let currentTab = 'weekly';

// Initialize tab functionality
export function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

// Switch between tabs
export function switchTab(tabName) {
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-tab') === tabName) {
            button.classList.add('active');
        }
    });
    
    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    const targetTab = document.getElementById(`${tabName}Tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    currentTab = tabName;
    
    // Emit custom event for other modules to listen
    document.dispatchEvent(new CustomEvent('tabChanged', { 
        detail: { tab: tabName } 
    }));
}

// Get current active tab
export function getCurrentTab() {
    return currentTab;
}

// Add smooth transition effects
export function addTabTransitions() {
    const style = document.createElement('style');
    style.textContent = `
        .tab-content {
            opacity: 0;
            transform: translateX(20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
        }
        
        .tab-content.active {
            opacity: 1;
            transform: translateX(0);
            pointer-events: auto;
        }
        
        .tab-button {
            transition: all 0.3s ease;
        }
        
        .tab-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
    `;
    document.head.appendChild(style);
}
