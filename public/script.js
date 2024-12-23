

document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('authToken');
    if (token || !token) {
        checkLogin(); // Fetch details if token already exists
    }
});


// Global Scripts
export function checkLogin() {
    const role = localStorage.getItem('role');
    console.log(`User role: ${role}`);

    // Check the current page URL
    const currentPage = window.location.pathname;
    const adminHomeBtn = document.getElementById('admin-home-btn');

    if (!role && currentPage !== '/index.html') {
        window.location.href = 'index.html';
    }
    else if (role === 'admin' && adminHomeBtn) {
        adminHomeBtn.style.display = 'block'; // Show admin-specific button
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
            //adminHomeBtn.style.display = 'none';
        });
    }

});


