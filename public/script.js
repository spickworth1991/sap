// Global Scripts



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


