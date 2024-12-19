document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const userRole = localStorage.getItem('role');
        const homePage = document.getElementById('home-page');
        if (userRole && homePage) {
            homePage.style.display = 'block';
        }
    }, 100);
});



document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }
});





document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('role');
    const logoutBtn = document.getElementById('logout-btn');
    const adminHomeBtn = document.getElementById('admin-home-btn');
    const homePageContent = document.getElementById('home-page');

    if (!userRole) {
        // Redirect to login page if not logged in
        window.location.href = 'login.html';
    } else {
        // Show content if logged in
        homePageContent.style.display = 'block';

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