document.addEventListener('DOMContentLoaded', () => {
    showInitialPage();
    
});

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

