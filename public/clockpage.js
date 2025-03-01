
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
const apiBaseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:5000/api/punch' // For local development
            : '/api/punch'; // For production deployment on Vercel
// Punch In function
export async function punchInHandler(button) {
    button.style.backgroundColor = "#555";


    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const spreadsheetId = localStorage.getItem('spreadsheetId');
    
    if (!token || !spreadsheetId || !username) {
        alert('You are not logged in!');
        return (window.location.href = 'index.html');
    }
    try {
        const response = await fetch(`${apiBaseUrl}/in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Optional
            },
            body: JSON.stringify({ username, role, spreadsheetId }),
        });

        const result = await response.json();

        if (response.ok) {
            updateStatus(result.message, "success");
        } else {
            updateStatus(result.message, "error");
        }
    } catch (error) {
        console.error('Error in Punch In:', error);
        updateStatus("Network error or server is unavailable.", "error");
    } finally {
        button.style.backgroundColor = "";
    }
}

// Punch Out function
export async function punchOutHandler(button) {
    button.style.backgroundColor = "#555";
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const spreadsheetId = localStorage.getItem('spreadsheetId');

    if (!token || !spreadsheetId || !username) {
        alert('You are not logged in!');
        return (window.location.href = 'index.html');
    }


    try {
        const response = await fetch(`${apiBaseUrl}/out`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Optional
            },
            body: JSON.stringify({ username, role, spreadsheetId }),

        });


        const result = await response.json();

        if (response.ok) {
            updateStatus(result.message, "success");
        } else {
            updateStatus(result.message, "error");
        }
    } catch (error) {
        console.error('Error in Punch Out:', error);
        updateStatus("Network error or server is unavailable.", "error");
    } finally {
        button.style.backgroundColor = "";
    }
}
