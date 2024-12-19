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
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const adminHomeBtn = document.getElementById('admin-home-btn');

    // Check if user is already logged in
    const userRole = localStorage.getItem('role');
    const spreadsheetId = localStorage.getItem('spreadsheetId');

    if (userRole) {
        // Redirect to homePage.html if the user is already logged in
        window.location.href = 'homePage.html';
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
                localStorage.setItem('spreadsheetId', data.spreadsheetId);

                // Redirect to homePage.html after successful login
                window.location.href = 'homePage.html';
            } catch (err) {
                loginError.textContent = 'Invalid username or password';
            }
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
            window.location.href = 'index.html';
        });
    }
});