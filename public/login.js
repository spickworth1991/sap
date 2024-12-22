
const apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api/auth'
    : '/api/auth'; // For production deployment on Vercel

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
            const response = await fetch(`${apiBaseUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();
            if (!response.ok) {
                loginError.textContent = result.error || 'Login failed';
                return;
            }

            localStorage.setItem('authToken', result.token);
            localStorage.setItem('username', username);
            window.location.href = 'clockPage.html';
        } catch (err) {
            loginError.textContent = 'An error occurred. Please try again later.';
        }
    });
}
