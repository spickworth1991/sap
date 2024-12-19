document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('role');
    const logoutBtn = document.getElementById('logout-btn');
    const adminHomeBtn = document.getElementById('admin-home-btn');
    const homePageContent = document.getElementById('home-page');

    // Prevent redirect loop on login page
    if (!userRole && window.location.pathname !== '/login.html') {
        window.location.href = 'login.html';
    } else if (userRole) {
        // Show content if logged in
        if (homePageContent) {
            homePageContent.style.display = 'block';
        }

        if (userRole === 'admin' && adminHomeBtn) {
            adminHomeBtn.style.display = 'inline-block';
        }
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('role');
            localStorage.removeItem('spreadsheetId');
            window.location.href = 'login.html';
        });
    }
});
