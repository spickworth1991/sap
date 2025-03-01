

document.addEventListener('DOMContentLoaded', () => {
    checkLogin(); // Fetch details if token already exists


 
});


// Global Scripts
export function adminButton() {
    // Dynamically create the admin button
    const navContainer = document.querySelector('navAdmin'); // Adjust the selector for your nav
    if (navContainer) {
        const adminHomeBtn = document.createElement('button');
        adminHomeBtn.id = 'admin-home-btn';
        adminHomeBtn.textContent = 'Admin Home';
        adminHomeBtn.addEventListener('click', () => {
            navigateTo('adminPage');
        });
        navContainer.appendChild(adminHomeBtn);
    } else {
        console.error('Navigation container not found.');
    }
}
window.adminButton = adminButton;

export function checkLogin() {
    const role = localStorage.getItem('role');
    console.log(`User role: ${role}`);

    // Check the current page URL
    const currentPage = window.location.pathname;
 

    if (!role && currentPage !== '/index.html') {
        window.location.href = 'index.html';
        alert('Please log on before visiting other pages');
    } else if (
        role === 'user' && 
        (
            currentPage === '/admin.html' || 
            currentPage === '/manage_users.html' || 
            currentPage === '/view_logs.html' || 
            currentPage === '/edit_entries.html'
        )
    ) {
        alert('Nice try :). You dont have access to this page.');
        window.location.href = 'homePage.html';
    } else if (role === 'admin') {
        adminButton();
    }
}

window.checkLogin = checkLogin;

// Navigation function to show the selected page
export function navigateTo(pageId) {
    const pageMap = {
        homePage: 'homePage.html',
        manageUsersPage: 'manage_users.html',
        viewLogsPage: 'view_logs.html',
        editEntriesPage: 'edit_entries.html',
        clockPage: 'clockPage.html',
        sapPage: 'sapPage.html',
        dateSelectionPage: 'dateSelect.html',
        adminPage: 'admin.html',
    };

    const pageUrl = pageMap[pageId];
    if (pageUrl) {
        window.location.href = pageUrl;
    } else {
        console.log(`Page not found: ${pageId}`);
    }
}
window.navigateTo = navigateTo;

export const adminHomeBtn = document.getElementById('admin-home-btn');

document.addEventListener('DOMContentLoaded', (event) => {
    event.preventDefault(); // Prevent default form submission
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            console.log('LocalStorage has been cleared:', localStorage);
            window.location.href = 'index.html';
        });
    }

});



// Function to update status and hide it after a certain duration
export async function updateStatus(message, type) {
    const statusBox = document.getElementById("statusBox");
  
    if (statusBox) {
        // Reset status classes
        statusBox.classList.remove("success", "error");
        statusBox.classList.add(type);
  
        // Handle message types
        if (typeof message === 'object' && message.code && message.message) {
            statusBox.innerText = `${type === 'error' ? 'Error' : 'Success'} ${message.code}: ${message.message}`;
        } else if (typeof message === 'string') {
            statusBox.innerText = message;
        } else {
            statusBox.innerText = type === 'error' ? 'An unknown error occurred.' : 'Operation successful.';
        }
  
        // Show status box
        statusBox.classList.add("show");
  
        // Hide status box after duration
        setTimeout(() => {
            statusBox.classList.remove("show");
        }, type === "success" ? 3000 : 5000);
    } else {
        console.error('Status box not found.');
    }
  }
  window.updateStatus = updateStatus;