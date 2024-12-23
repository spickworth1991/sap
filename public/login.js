async function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('authToken', data.token); // Store the token
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

// Attach login form event listener
document.getElementById('login-form').addEventListener('submit', handleLogin);

async function fetchUserDetails() {
    try {
        const response = await fetch('/auth/user-details', {
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

    if (role === 'admin') {
        console.log('Admin tools are enabled.');
        // Load admin-specific logic here
    } else if (role) {
        console.log('User-specific tools are enabled.');
        // Load user-specific logic here
    } else {
        console.log('No role defined, redirecting to login page.');
        // Redirect to login or show an error
        window.location.href = '/login';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        fetchUserDetails(); // Fetch details if token already exists
    }
});