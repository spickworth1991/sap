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
