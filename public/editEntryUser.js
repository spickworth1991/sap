document.addEventListener('DOMContentLoaded', async () => {
    // Only run this code if the current page is editentryuser.html
    if (window.location.pathname.includes('editentryuser.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const date = urlParams.get('date');

        if (!date) {
            updateStatus("No date provided.", "error");
            return;
        }

        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('role');
        const spreadsheetId = localStorage.getItem('spreadsheetId');

        if (!token || !spreadsheetId || !username) {
            alert('You are not logged in!');
            return (window.location.href = 'index.html');
        }

    
    
        try {
            const response = await fetch(`/api/entries/${encodeURIComponent(date)}`, {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Optional
                },
                body: JSON.stringify({ spreadsheetId, username, role, date }),
            });
            const data = await response.json();
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error: ${response.status} - ${errorText}`);
            }

            

            const entriesContainer = document.getElementById('entriesContainer');
            if (!entriesContainer) {
                updateStatus("entriesContainer not found.", "error");
                return;
            }

            if (!data.entries || data.entries.length === 0) {
                entriesContainer.innerHTML = '<p>No entries found for this date.</p>';
                return;
            }

            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Project/Activity</th>
                        <th>Elapsed Time</th>
                        <th>SAP Time</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.entries.map(entry => {
                        const { rowNumber, values } = entry;
                        return `
                            <tr>
                                <td>${values[0] || ''}</td>
                                <td>${values[1] || ''}</td>
                                <td>${values[2] || ''}</td>
                                <td>${values[3] || ''}</td>
                                <td>${values[4] || ''}</td>
                                <td><button class="button edit-button" onclick="editEntry('${date}', ${rowNumber})">Edit</button></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;

            entriesContainer.appendChild(table);

        } catch (error) {
            console.error('Error fetching entries:', error);
            updateStatus({ code: 9999, message: "Network error or server is unavailable." }, "error");
        }
    }
});


async function editEntry(date, rowIndex) {
    const newTime = prompt('Enter new time (HH:mm:ss):');
    const newProjectActivity = prompt('Enter new project/activity:');

    if (!newTime || !newProjectActivity) {
        alert('Both time and project/activity are required.');
        return;
    }
    
    try {
        const response = await fetch('/api/editEntry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "spreadsheet-id": localStorage.getItem('spreadsheetId'),  // Add spreadsheetId header
                "username": localStorage.getItem('username'), // Send username in headers
            
            },
            body: JSON.stringify({ date, rowIndex, time: newTime, projectActivity: newProjectActivity }),
        });

        const result = await response.json();

        if (response.ok) {
            window.location.href = `/editentryuser.html?date=${encodeURIComponent(date)}`
        } else {
            alert(`Error: ${result.error || 'Failed to refresh page, try manually refreshing.'}`);
        }
    } catch (error) {
        console.error('Error editing entry:', error);
        alert('Error editing entry.');
    }
}
