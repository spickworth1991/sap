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

    
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');
        const spreadsheetId = localStorage.getItem('spreadsheetId');
        if (!token || !spreadsheetId || !username) {
            alert('You are not logged in!');
            return (window.location.href = 'index.html');
        }
        try {
            const response = await fetch(`${apiBaseUrl}/punch/in`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ spreadsheetId })
            });

    

        const result = await response.json();

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

    
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');
        const spreadsheetId = localStorage.getItem('spreadsheetId');

        if (!token || !spreadsheetId || !username) {
            alert('You are not logged in!');
            return (window.location.href = 'index.html');
        }

        
    try {
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

export async function fetchSpreadsheetId() {
    // Updated login.js with enhanced logging
  const apiBaseUrl = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api/auth'
  : '/api/auth'; // For production deployment on Vercel
  try {
      const response = await fetch(`${apiBaseUrl}/user-details`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
      });

      if (response.ok) {
          const data = await response.json();
          localStorage.setItem('spreadsheetId', data.user.spreadsheetId);
          console.log(`spreadsheetId At fetchSpreadsheetId: ${data.user.spreadsheetId}`);
      } else {
          console.error('Failed to fetch user details');
      }
  } catch (error) {
      console.error('Error fetching user details:', error);
  }
}