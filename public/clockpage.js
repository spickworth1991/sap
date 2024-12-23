

const apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api'; // For production deployment on Vercel

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
export async function punchInHandler(button) {
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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ spreadsheetId }) // Username is not needed if it’s already in the token
        });

        //const result = await response.json();

        if (response.ok) {
            //updateStatus(result.message, "success");
        } else {
            //updateStatus(result.message, "error");
        }
    } catch (error) {
        console.error('Error in Punch In:', error);
        //updateStatus("Network error or server is unavailable.", "error");
    } finally {
        button.style.backgroundColor = "";
    }
}

// Punch Out function
export async function punchOutHandler(button) {
    button.style.backgroundColor = "#555";

    try {
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');
        const spreadsheetId = localStorage.getItem('spreadsheetId');

        if (!token || !spreadsheetId || !username) {
            alert('You are not logged in!');
            return (window.location.href = 'index.html');
        }

        const response = await fetch(`${apiBaseUrl}/punch/out`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'spreadsheet-id': spreadsheetId,
                'username': username,
                'Content-Type': 'application/json'
            },
        });

        //const result = await response.json();

        if (response.ok) {
            //updateStatus(result.message, "success");
        } else {
            //updateStatus(result.message, "error");
        }
    } catch (error) {
        console.error('Error in Punch Out:', error);
        //updateStatus("Network error or server is unavailable.", "error");
    } finally {
        button.style.backgroundColor = "";
    }
}
