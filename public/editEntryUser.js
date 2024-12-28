document.addEventListener('DOMContentLoaded', async () => {
    
    // Only run this code if the current page is editentryuser.html
    if (window.location.pathname.includes('editentryuser.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        let date = urlParams.get('date');

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

    
        const apiBaseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:5000/api/entries' // For local development
            : '/api/entries'; // For production deployment on Vercel
        try {
            showLoading()
            const response = await fetch(`${apiBaseUrl}/date`, {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Optional
                },
                body: JSON.stringify({ spreadsheetId, username, role, date }),
            });
            const data = await response.json();
            if (!response.ok) {
                const errorText = data.error || 'Failed to fetch entries.';
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
            
            const tableContainer = document.createElement('div');
            tableContainer.className = 'table-container';

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
                        const isTotalsRow = values[2] === 'Totals'; // Check if the "Project/Activity" column contains "Totals"
                        return `
                            <tr>
                                <td data-label="Date">${values[0] || ''}</td>
                                <td data-label="Time">${values[1] || ''}</td>
                                <td data-label="Project/Activity">${values[2] || ''}</td>
                                <td data-label="Elapsed Time">${values[3] || ''}</td>
                                <td data-label="SAP Time">${values[4] || ''}</td>
                                <td data-label="Action">${isTotalsRow ? '' : `<button class="button edit-button editEntry" data-row-number="${rowNumber}">Edit</button>`}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;
            tableContainer.appendChild(table);
            entriesContainer.appendChild(tableContainer);
            initializeEditEntryButtons()

        } catch (error) {
            console.error('Error fetching entries:', error);
            updateStatus({ code: 9999, message: "Network error or server is unavailable." }, "error");
        } finally {
            hideLoading();
        }
    }
});


export async function editEntryHandler(rowNumber) {
    const button = event.target;
    const date = button.closest('tr').querySelector('td').innerText;
    const newTime = prompt('Enter new time (HH:mm:ss):');
    const newProjectActivity = prompt('Enter new project/activity:');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const spreadsheetId = localStorage.getItem('spreadsheetId');
    
    if (!newTime || !newProjectActivity) {
        alert('Both time and project/activity are required.');
        return;
    }
    const apiBaseUrl2 = window.location.hostname === 'localhost'
            ? 'http://localhost:5000/api/edit' // For local development
            : '/api/edit'; // For production deployment on Vercel
    try {
        showLoading();
        const response = await fetch(`${apiBaseUrl2}/edit`, {
            method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Optional
                    
                },
                body: JSON.stringify({ username, role, spreadsheetId, date, newTime, newProjectActivity, rowNumber }),
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
    } finally {
        hideLoading();
    }   
}

const loadingElement = document.createElement('div');
loadingElement.id = 'loading';
loadingElement.innerText = 'Loading...';
loadingElement.style.position = 'fixed';
loadingElement.style.top = '20px';
loadingElement.style.left = '50%';
loadingElement.style.transform = 'translateX(-50%)';
loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
loadingElement.style.color = 'white';
loadingElement.style.padding = '10px 20px';
loadingElement.style.borderRadius = '5px';
loadingElement.style.zIndex = '1000';

function showLoading() {
    document.body.appendChild(loadingElement);
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        document.body.removeChild(loadingElement);
    }
}

// Function to check for all editEntry buttons and attach the event listener
function initializeEditEntryButtons() {
    const editEntries = document.querySelectorAll('.editEntry'); // Adjust the selector for your buttons
    if (editEntries.length > 0) {
        editEntries.forEach(editEntry => {
            editEntry.addEventListener('click', (event) => {
                const rowNumber = event.target.getAttribute('data-row-number');
                console.log(`Row number at intialize: ${rowNumber}`);
                // Perform the desired action with the rowNumber
                // For example, make an API call to edit the entry
                editEntryHandler(rowNumber);
            }); // Attach click event
        });
    } else {
        console.error('No editEntry buttons found.');
    }
}