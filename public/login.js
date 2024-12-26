// Updated login.js with enhanced logging
const apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/auth'
    : '/api/auth'; // For production deployment on Vercel

    document.addEventListener('DOMContentLoaded', () => {
        // Ensure DOM is ready before attaching event listeners
        
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);    
        }
    
        const token = localStorage.getItem('authToken');
        if (token) {
            showInitialPage(); // Show Intial Page
        }
    });



    
    async function handleLogin(event) {
        event.preventDefault(); // Prevent default form submission
    
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        console.log(`username: ${username}`);
        //console.log(`password: ${password}`);
    
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
                console.log('username/token stored');
                updateStatus(response.message, "success");
                fetchUserDetails(); // Fetch user details after successful login
            } else {
                console.error('Login failed');
                updateStatus(response.message, "error");
            }
        } catch (error) {
            console.error('Error during login:', error);
            updateStatus("Network error or server is unavailable.", "error");
        }
    }
    


export async function fetchUserDetails() {
    try {
        const response = await fetch(`${apiBaseUrl}/user-details`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('role', data.user.role);
            localStorage.setItem('spreadsheetId', data.user.spreadsheetId);
            //console.log(`username: ${data.user.username}`);
            //console.log(`spreadsheetId: ${data.user.spreadsheetId}`);
            showInitialPage(); // Call showInitialPage after successfully fetching details
        } else {
            console.error('Failed to fetch user details');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
    }
}

function showInitialPage() {
    const currentPage = window.location.pathname;
    const role = localStorage.getItem('role');

    if (role === 'user' && (currentPage === '/' || currentPage.startsWith('/index.html'))) {
        console.log(`User role: ${role}`);
        window.location.href = 'homePage.html';
    } else if (role === 'admin' && (currentPage === '/' || currentPage.startsWith('/index.html'))) {
        console.log(`User role: ${role}`);
        window.location.href = 'homePage.html';
        localStorage.setItem('adminNavigate', 'true'); // Set flag for admin-specific setup
    } else {
        // Redirect to index.html for non-role users
        if (!role) {
            console.log(`User role: ${role}`);
            window.location.href = 'index.html';
        }
    }
}
