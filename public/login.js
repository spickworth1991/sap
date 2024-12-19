document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const adminHomeBtn = document.getElementById('admin-home-btn');
    const loginPage = document.getElementById('login-page');
    const homePage = document.getElementById('home-page');
    const userRole = localStorage.getItem('role');

    // Check if user is logged in
    
    const spreadsheetId = localStorage.getItem('spreadsheetId');
    if (userRole) {
        loginPage.style.display = 'none';
        homePage.style.display = 'block';
        if (userRole === 'admin') {
            adminHomeBtn.style.display = 'inline-block';
        }
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
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
});