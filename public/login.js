import { decodeToken, setUserDetails, showInitialPage } from './script.js';

document.addEventListener('DOMContentLoaded', () => {
    showInitialPage();
    
});


// Updated login.js with enhanced logging
const apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api/auth'
    : '/api/auth'; // For production deployment on Vercel

// Login form submission
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

async function loginUser(event, button) {
    // Prevent default form submission
    event.preventDefault();
    loginError.textContent = ''; // Clear previous error message
    button.style.backgroundColor = "#555";

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${apiBaseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            loginError.textContent = result.error || 'Login failed';
            return;
        }

        const result = await response.json();
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('username', username); // Store the username
        window.location.href = 'homePage.html';

    } catch (err) {
        console.error('Fetch error:', err);
        loginError.textContent = 'An error occurred. Please try again later.';
    }
}

