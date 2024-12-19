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
const logoutBtn = document.getElementById('logout-btn')
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('role');
        localStorage.removeItem('spreadsheetId');
        window.location.href = 'index.html'
        adminHomeBtn.style.display = 'none';
    });
}