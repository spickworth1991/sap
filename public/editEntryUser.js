document.addEventListener('DOMContentLoaded', () => {
    const entriesContainer = document.getElementById('entriesContainer');
    const entries = JSON.parse(localStorage.getItem('fetchedEntries'));
    const selectedDate = localStorage.getItem('selectedDate');

    if (!entries || entries.length === 0) {
        entriesContainer.innerHTML = '<p>No entries found for the selected date.</p>';
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
            ${entries.map(entry => {
                const { rowNumber, values } = entry;
                return `
                    <tr>
                        <td>${values[0] || ''}</td>
                        <td>${values[1] || ''}</td>
                        <td>${values[2] || ''}</td>
                        <td>${values[3] || ''}</td>
                        <td>${values[4] || ''}</td>
                        <td><button class="button edit-button" onclick="editEntry('${selectedDate}', ${rowNumber})">Edit</button></td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;

    entriesContainer.appendChild(table);
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
            alert(result.message);
            fetchEntriesByDate(); // Refresh entries after update
        } else {
            alert(`Error: ${result.error || 'Failed to edit entry.'}`);
        }
    } catch (error) {
        console.error('Error editing entry:', error);
        alert('Error editing entry.');
    }
}
