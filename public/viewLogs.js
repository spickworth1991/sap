let logsData = [];
let currentPage = 1;
const logsPerPage = 10;

// Fetch Logs from the Server
async function fetchLogs() {
    const selectedDate = document.getElementById('logDatePicker').value; // In YYYY-MM-DD format
    const searchTerm = document.getElementById('logSearch').value;

    // Convert YYYY-MM-DD to MM-DD-YYYY
    const [year, month, day] = selectedDate.split('-');
    const formattedDate = `${month}-${day}-${year}`;

    try {
        const response = await fetch(`/api/logs?date=${formattedDate}&search=${encodeURIComponent(searchTerm)}`, {
            headers: { 
                'Content-Type': 'application/json',
                'spreadsheet-id': localStorage.getItem('spreadsheetId') // Attach spreadsheet ID
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch logs');
        }

        const data = await response.json();
        logsData = data.logs;
        currentPage = 1;
        displayLogs();
    } catch (error) {
        console.error('Error fetching logs:', error);
        alert('Error fetching logs.');
    }
}


// Display Logs with Pagination
function displayLogs() {
    const logsBody = document.getElementById('logsBody');
    logsBody.innerHTML = '';

    const start = (currentPage - 1) * logsPerPage;
    const end = start + logsPerPage;
    const paginatedLogs = logsData.slice(start, end);

    paginatedLogs.forEach(log => {
        const row = `<tr>
            <td>${log.date}</td>
            <td>${log.time}</td>
            <td>${log.username}</td>
            <td>${log.action}</td>
            <td>${log.details}</td>
        </tr>`;
        logsBody.innerHTML += row;
    });

    document.getElementById('currentPage').innerText = `Page ${currentPage}`;
}

// Pagination Controls
function nextPage() {
    if (currentPage * logsPerPage < logsData.length) {
        currentPage++;
        displayLogs();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayLogs();
    }
}
