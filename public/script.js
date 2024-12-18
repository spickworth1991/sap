document.addEventListener('DOMContentLoaded', () => {
    const loginPage = document.getElementById('login-page');
    const homePage = document.getElementById('home-page');
    const adminPage = document.getElementById('admin-page');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const adminHomeBtn = document.getElementById('admin-home-btn');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    const loginError = document.getElementById('login-error');

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
            loginPage.style.display = 'none';
            homePage.style.display = 'block';

            if (data.role === 'admin') {
                adminHomeBtn.style.display = 'inline-block';
            }
        } catch (err) {
            loginError.textContent = 'Invalid username or password';
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        homePage.style.display = 'none';
        loginPage.style.display = 'block';
    });

    adminHomeBtn.addEventListener('click', () => {
        homePage.style.display = 'none';
        adminPage.style.display = 'block';
    });

    backToHomeBtn.addEventListener('click', () => {
        adminPage.style.display = 'none';
        homePage.style.display = 'block';
    });
});