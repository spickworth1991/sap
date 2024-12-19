document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const userRole = localStorage.getItem('role');
        const homePage = document.getElementById('home-page');
        if (userRole && homePage) {
            homePage.style.display = 'block';
        }
    }, 100);
});


document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }
});

