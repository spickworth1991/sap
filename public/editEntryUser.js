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

    
    
        try {
            showLoading()
            const response = await fetch(`/api/entries/date`, {
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
                                <td>${values[0] || ''}</td>
                                <td>${values[1] || ''}</td>
                                <td>${values[2] || ''}</td>
                                <td>${values[3] || ''}</td>
                                <td>${values[4] || ''}</td>
                                <td>${isTotalsRow ? '' : `<button class="button edit-button editEntry" data-row-number="${rowNumber}">Edit</button>`}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;
            entriesContainer.appendChild(table);
            initializeEditEntryButtons()

        } catch (error) {
            console.error('Error fetching entries:', error);
            updateStatus({ code: 9999, message: "Network error or server is unavailable." }, "error");
        } finally {
            hideLoading();
        }
    }
});


export async function editEntryHandler(editEntry) {
    const button = event.target;
    const rowIndex = button.getAttribute('data-row-number');
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
    
    try {
        showLoading();
        const response = await fetch('/api/edit/edit', {
            method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    
                },
                body: JSON.stringify({ username, role, spreadsheetId, date, rowIndex, time: newTime, projectActivity: newProjectActivity }),
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
            editEntry.addEventListener('click', () => editEntryHandler(editEntry)); // Attach click event
        });
    } else {
        console.error('No editEntry buttons found.');
    }
}
