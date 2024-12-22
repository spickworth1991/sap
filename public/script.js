// Global Scripts

function decodeToken(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = atob(payloadBase64);
        return JSON.parse(decodedPayload);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
  }
  
  function setUserDetails(authToken) {
    const userData = decodeToken(authToken);
    if (userData) {
        localStorage.setItem('role', userData.role);
        localStorage.setItem('spreadsheetId', userData.spreadsheetId);
    } else {
        console.error('Failed to decode user details from token.');
    }
  }
  
  
  function showInitialPage() {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        setUserDetails(authToken);
    }
  
    const role = localStorage.getItem('role');
    console.log(`userRole: ${role}`);
  
    // Check the current page URL
    const currentPage = window.location.pathname;
    const adminHomeBtn = document.getElementById('admin-home-btn');
  
    if (role) {
        // Redirect to homePage.html if not already there
        if (currentPage !== '/homePage.html') {
            window.location.href = 'homePage.html';
        } else if (role === 'admin' && adminHomeBtn) {
            adminHomeBtn.style.display = 'inline-block';
        }
    } else {
        // Redirect to index.html for non-admin users
        if (currentPage !== '/index.html' && currentPage !== '/') {
            window.location.href = 'index.html';
        }
    }
  }


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
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});
