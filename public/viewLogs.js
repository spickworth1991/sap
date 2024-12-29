document.addEventListener('DOMContentLoaded', () => {
    const viewLogs = document.getElementById('viewLogs');
    if (viewLogs) {
        viewLogs.addEventListener('click', () => fetchLogs(viewLogs)); // Attach click event
    } else {
        console.error('fetchLogs Error at button.');
    }

    const nextPage = document.getElementById('nextPage');
    if (nextPage) {
        nextPage.addEventListener('click', () => nextPage(nextPage)); // Attach click event
    } else {
        console.error('fetchLogs Error at button.');
    }

    const prevPage = document.getElementById('prevPage');
    if (prevPage) {
        prevPage.addEventListener('click', () => prevPage(prevPage)); // Attach click event
    } else {
        console.error('fetchLogs Error at button.');
    }
});





let logsData = [];
let currentPage = 1;
const logsPerPage = 10;

// Fetch Logs from the Server
async function fetchLogs(button) {
    button.style.backgroundColor = "#555";
    const selectedDate = document.getElementById('logDatePicker').value; // In YYYY-MM-DD format
    const searchTerm = document.getElementById('logSearch').value;

    // Convert YYYY-MM-DD to MM/DD/YYYY
    const [year, month, day] = selectedDate.split('-');
    const formattedDate = `${month}/${day}/${year}`;

    try {
        const response = await fetch(`/api/viewLogs/?date=${formattedDate}&search=${encodeURIComponent(searchTerm)}`, {
            headers: { 
                'Content-Type': 'application/json',
                'authorization': `Bearer ${localStorage.getItem('token')}`
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
       
    } finally {
        button.style.backgroundColor = "";
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
async function nextPage() {
    if (currentPage * logsPerPage < logsData.length) {
        currentPage++;
        displayLogs();
    }
}

async function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayLogs();
    }
}
