document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const adminHomeBtn = document.getElementById('admin-home-btn');
    const loginPage = document.getElementById('login-page');
    const homePage = document.getElementById('home-page');

    // Check if user is logged in
    const userRole = localStorage.getItem('role');
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
                loginPage.style.display = 'none';
                homePage.style.display = 'block';

                if (data.role === 'admin') {
                    adminHomeBtn.style.display = 'inline-block';
                }
            } catch (err) {
                loginError.textContent = 'Invalid username or password';
            }
        });
    }

    function navigate(pageId) {
        showPage(pageId);
    }
    
    // Function to update status and hide it after a certain duration
    function updateStatus(message, type) {
        const statusBox = document.getElementById("statusBox");
    
        if (statusBox) {
            if (typeof message === 'object' && message.code && message.message) {
                statusBox.innerText = `${type === 'error' ? 'Error' : 'Success'} ${message.code}: ${message.message}`;
            } else if (typeof message === 'string') {
                statusBox.innerText = message;
            } else {
                statusBox.innerText = type === 'error' ? 'An unknown error occurred.' : 'Operation successful.';
            }
    
            statusBox.className = type;
            statusBox.classList.add("show");
            console.log("statusBox.classList", statusBox.classList);
            // Hide the status box after a delay
            setTimeout(() => {
                statusBox.classList.remove("show");
            }, type === "success" ? 3000 : 5000);
        }
    }
    

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('role');
            loginPage.style.display = 'block';
            homePage.style.display = 'none';
            adminHomeBtn.style.display = 'none';
        });
    }
});