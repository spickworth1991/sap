// Fetch Entries by Date function
async function fetchEntriesByDate() {
    const dateInput = document.getElementById('datePicker').value;
    if (!dateInput) {
        updateStatus("Please select a date.", "error");
        return;
    }

    // Convert date from YYYY-MM-DD to MM/DD/YYYY
    const [year, month, day] = dateInput.split('-');
    const formattedDate = `${month}/${day}/${year}`;
    console.log("Formatted date:", formattedDate);

    const encodedDate = encodeURIComponent(formattedDate);

    window.location.href = 'editentryuser.html';

    try {
        const response = await fetch(`/api/entries/${encodedDate}`, {
            headers: { 
                "Content-Type": "application/json",
                "spreadsheet-id": localStorage.getItem('spreadsheetId')  // Add spreadsheetId header
            },
        });
        console.log("Fetch response:", response);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("Fetched data:", data);

        const entriesContainer = document.getElementById('entriesContainer');
        entriesContainer.innerHTML = ''; // Clear previous entries

        if (!data.entries || data.entries.length === 0) {
            entriesContainer.innerHTML = '<p>No entries found for this date.</p>';
            return;
        }

        // Create a table to display entries
        const table = document.createElement('table');
        table.classList.add('entries-table');
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
                            <td><button class="button edit-button" onclick="editEntry('${formattedDate}', ${rowNumber})">Edit</button></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;

        entriesContainer.appendChild(table);
        navigateTo('editEntriesPage');
    } catch (error) {
        console.error('Error fetching entries:', error);
        updateStatus({ code: 9999, message: "Network error or server is unavailable." }, "error");
    }
}