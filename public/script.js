// Global Scripts



// Navigation function to show the selected page
function navigateTo(pageId) {
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

document.addEventListener('DOMContentLoaded', () => {
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('role');
            localStorage.removeItem('spreadsheetId');
            window.location.href = 'index.html'
            adminHomeBtn.style.display = 'none';
        });
    }

});


