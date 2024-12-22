// Global Scripts


document.addEventListener('DOMContentLoaded', () => {
    // Run the function only on index.html or homePage.html
    const currentPage = window.location.pathname;
    if (currentPage === '/index.html' || currentPage === '/homePage.html'|| currentPage === '/') {
        showInitialPage();
    }
});

function showInitialPage() {
    const adminHomeBtn = document.getElementById('admin-home-btn');
    const userRole = localStorage.getItem('authToken');
    console.log(`userRole: ${userRole}`);

    // Check the current page URL
    const currentPage = window.location.pathname;

    if (userRole) {
        // If the user is logged in and not on the home page, redirect to homePage.html
        if (currentPage !== '/homePage.html') {
            window.location.href = 'homePage.html';
        } else if (userRole === 'admin' && adminHomeBtn) {
            adminHomeBtn.style.display = 'inline-block';
        }
    } else {
        // If no user role and not on the login page, redirect to index.html
        if (currentPage !== '/index.html'|| currentPage === '/') {
            window.location.href = 'index.html';
        }
    }
}

// Navigation function to show the selected page
function navigateTo(pageId) {
    switch (pageId) {
        case 'homePage':
            window.location.href = 'homePage.html';
            break;
        case 'manageUsersPage':
            window.location.href = 'manage_users.html';
            break;
        case 'viewLogsPage':
            window.location.href = 'view_logs.html';
            break;
        case 'editEntriesPage':
            window.location.href = 'edit_entries.html';
            break;
        case 'clockPage':
            window.location.href = 'clockPage.html';
            break;
        case 'sapPage':
            window.location.href = 'sapPage.html';
            break;
        case 'dateSelectionPage':
            window.location.href = 'dateSelect.html';
            break;
        case 'adminPage':
            window.location.href = 'admin.html';
            break;
        default:
            console.log(`Page not found: ${pageId}`);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});


// Function to update status and hide it after a certain duration

function updateStatus(message, type) {
    const statusBox = document.getElementById("statusBox");

    if (statusBox) {
        statusBox.classList.remove("success", "error");
        statusBox.classList.add(type);

        if (typeof message === 'object' && message.code && message.message) {
            statusBox.innerText = `${type === 'error' ? 'Error' : 'Success'} ${message.code}: ${message.message}`;
        } else if (typeof message === 'string') {
            statusBox.innerText = message;
        } else {
            statusBox.innerText = type === 'error' ? 'An unknown error occurred.' : 'Operation successful.';
        }

        statusBox.classList.add("show");

        setTimeout(() => {
            statusBox.classList.remove("show");
        }, type === "success" ? 3000 : 5000);
    }
}