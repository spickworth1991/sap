import { fetchUserDetails } from './login.js';

document.addEventListener('DOMContentLoaded', () => {

    const punchIn = document.getElementById('punchInButton');
        if (punchIn) {
            punchIn.addEventListener('submit', punchIn);
        } else {
            console.error('Punch In Failed at advent.');
        }

    const punchOut = document.getElementById('punchOutButton');
        if (punchOut) {
            punchOut.addEventListener('submit', punchOut);
        } else {
            console.error('Punch In Failed at advent.');
        }

    const token = localStorage.getItem('authToken');
    if (token) {
        fetchUserDetails(); // Fetch details if token already exists
    }
});



// Punch In function
async function punchIn(button) {
    button.style.backgroundColor = "#555";

    try {
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');
        const spreadsheetId = localStorage.getItem('spreadsheetId');

        if (!token || !spreadsheetId || !username) {
            alert('You are not logged in!');
            return (window.location.href = 'index.html');
        }

        const response = await fetch('/api/punch/in', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'spreadsheet-id': spreadsheetId,
                'username': username,
            },
        });

        const result = await response.json();

        if (response.ok) {
            updateStatus(result, "success");
        } else {
            updateStatus(result, "error");
        }
    } catch (error) {
        console.error('Error in Punch In:', error);
        updateStatus({ code: 9999, message: "Network error or server is unavailable." }, "error");
    } finally {
        button.style.backgroundColor = "";
    }
}

// Punch Out function
async function punchOut(button) {
    button.style.backgroundColor = "#555";

    try {
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');
        const spreadsheetId = localStorage.getItem('spreadsheetId');

        if (!token || !spreadsheetId || !username) {
            alert('You are not logged in!');
            return (window.location.href = 'index.html');
        }

        const response = await fetch('/api/punch/out', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'spreadsheet-id': spreadsheetId,
                'username': username,
            },
        });

        const result = await response.json();

        if (response.ok) {
            updateStatus(result, "success");
        } else {
            updateStatus(result, "error");
        }
    } catch (error) {
        console.error('Error in Punch Out:', error);
        updateStatus({ code: 9999, message: "Network error or server is unavailable." }, "error");
    } finally {
        button.style.backgroundColor = "";
    }
}