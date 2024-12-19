document.addEventListener('DOMContentLoaded', () => {
    const adminHomeBtn = document.getElementById('admin-home-btn');
    const loginPage = document.getElementById('login-page');
    const homePage = document.getElementById('home-page');
    const userRole = localStorage.getItem('role');

    // Hide both pages initially
    if (loginPage) loginPage.style.display = 'none';
    if (homePage) homePage.style.display = 'none';

    // Show appropriate page based on login status
    if (userRole) {
        if (homePage) homePage.style.display = 'block';
        if (userRole === 'admin' && adminHomeBtn) {
            adminHomeBtn.style.display = 'inline-block';
        }
    } else {
        if (loginPage) loginPage.style.display = 'block';
    }
});


// Login form submission
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = ''; // Clear previous error message
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            localStorage.setItem('role', data.role);
            localStorage.setItem('spreadsheetId', data.spreadsheetId);  // Store spreadsheetId
            window.location.href = 'homePage.html'

            if (data.role === 'admin') {
                adminHomeBtn.style.display = 'inline-block';
            }
        } catch (err) {
            loginError.textContent = 'Invalid username or password';
        }
    });
}

// Logout functionality

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('role');
        localStorage.removeItem('spreadsheetId');
        window.location.href = 'login.html'
        adminHomeBtn.style.display = 'none';
    });
}
