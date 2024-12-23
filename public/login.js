// Updated login.js with enhanced logging
const apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api/auth'
    : '/api/auth'; // For production deployment on Vercel

    document.addEventListener('DOMContentLoaded', () => {
        // Ensure DOM is ready before attaching event listeners
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        } else {
            console.error('Login form not found. Ensure the form ID is "login-form".');
        }
    
        const token = localStorage.getItem('authToken');
        if (token) {
            fetchUserDetails(); // Fetch details if token already exists
        }
    });
    
    async function handleLogin(event) {
        event.preventDefault(); // Prevent default form submission
    
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        console.log(`username: ${username}`);
        console.log(`password: ${password}`);
    
        const loginButton = document.getElementById('login-button');
        if (loginButton) {
            loginButton.style.backgroundColor = "#555";
        }
    
        try {
            const response = await fetch(`${apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
    
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('authToken', data.token); // Store the token
                localStorage.setItem('username', username); // Store the username
                console.log('Login successful, token stored');
                fetchUserDetails(); // Fetch user details after successful login
            } else {
                console.error('Login failed');
                document.getElementById('statusBox').textContent = 'Invalid username or password';
            }
        } catch (error) {
            console.error('Error during login:', error);
            document.getElementById('statusBox').textContent = 'An error occurred during login';
        }
    }
    



async function fetchUserDetails() {
    try {
        const response = await fetch('/api/users', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('role', data.user.role);
            localStorage.setItem('spreadsheetId', data.user.spreadsheetId);
            showInitialPage(); // Call showInitialPage after successfully fetching details
        } else {
            console.error('Failed to fetch user details');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
    }
}

function showInitialPage() {
    const role = localStorage.getItem('role');
    console.log(`User role: ${role}`);

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


document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        fetchUserDetails(); // Fetch details if token already exists
    }
});

