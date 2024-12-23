// Updated login.js with enhanced logging
const apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api/auth'; // For production deployment on Vercel

document.addEventListener('DOMContentLoaded', () => {
    const punchIn = document.getElementById('punchInButton');
    if (punchIn) {
        punchIn.addEventListener('click', () => punchInHandler(punchIn)); // Attach click event
    } else {
        console.error('Punch In button not found.');
    }

    const punchOut = document.getElementById('punchOutButton');
    if (punchOut) {
        punchOut.addEventListener('click', () => punchOutHandler(punchOut)); // Attach click event
    } else {
        console.error('Punch Out button not found.');
    }


});



// Punch In function
export async function punchInHandler(button, event) {
    button.style.backgroundColor = "#555";

    try {
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');
        const spreadsheetId = localStorage.getItem('spreadsheetId');

        if (!token || !spreadsheetId || !username) {
            alert('You are not logged in!');
            return (window.location.href = 'index.html');
        }

        const response = await fetch(`${apiBaseUrl}/punch/in`, {
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
window.punchInHandler = punchInHandler;

// Punch Out function
async function punchOutHandler(button) {
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