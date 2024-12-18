document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const adminHomeBtn = document.getElementById('admin-home-btn');
    const loginPage = document.getElementById('login-page');
    const homePage = document.getElementById('home-page');

    // Check if user is logged in
    const userRole = localStorage.getItem('role');
    const spreadsheetId = localStorage.getItem('spreadsheetId');
    if (userRole) {
        loginPage.style.display = 'none';
        homePage.style.display = 'block';
        if (userRole === 'admin') {
            adminHomeBtn.style.display = 'inline-block';
        }
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (!response.ok) {
                    throw new Error('Login failed');
                }

                const data = await response.json();
                localStorage.setItem('role', data.role);
                localStorage.setItem('spreadsheetId', data.spreadsheetId);  // Store spreadsheetId
                loginPage.style.display = 'none';
                homePage.style.display = 'block';

                if (data.role === 'admin') {
                    adminHomeBtn.style.display = 'inline-block';
                }
            } catch (err) {
                loginError.textContent = 'Invalid username or password';
            }
        });
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('role');
            localStorage.removeItem('spreadsheetId');
            loginPage.style.display = 'block';
            homePage.style.display = 'none';
            adminHomeBtn.style.display = 'none';
        });
    }
});

// Navigation function
function showPage(pageId) {
    const pages = ["homePage", "clockPage", "sapPage", "dateSelectionPage", "editEntriesPage"];
    pages.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = id === pageId ? "block" : "none";
        }
    });
}

function navigate(pageId) {
    showPage(pageId);
}

// Function to update status and hide it after a certain duration
function updateStatus(message, type) {
    const statusBox = document.getElementById("statusBox");

    if (statusBox) {
        if (typeof message === 'object' && message.code && message.message) {
            statusBox.innerText = `${type === 'error' ? 'Error' : 'Success'} ${message.code}: ${message.message}`;
        } else if (typeof message === 'string') {
            statusBox.innerText = message;
        } else {
            statusBox.innerText = type === 'error' ? 'An unknown error occurred.' : 'Operation successful.';
        }

        statusBox.className = type;
        statusBox.classList.add("show");
        console.log("statusBox.classList", statusBox.classList);
        // Hide the status box after a delay
        setTimeout(() => {
            statusBox.classList.remove("show");
        }, type === "success" ? 3000 : 5000);
    }
}

// SAP Input function
async function sapInput(button) {
    const inputBox = document.getElementById("inputBox");
    const inputText = inputBox?.value.trim();
  
    if (!inputText) {
      inputBox.classList.add("input-error");
      updateStatus("Please enter some text.", "error");
      return;
    }
  
    button.style.backgroundColor = "#555";
  
    try {
      const response = await fetch("/api/sapInput", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "spreadsheet-id": localStorage.getItem('spreadsheetId')  // Add spreadsheetId header
        },
        body: JSON.stringify({ input: inputText }),
      });
  
      if (response.ok) {
        updateStatus("SAP Input submitted successfully!", "success");
        inputBox.value = "";
        inputBox.classList.remove("input-error");
      } else {
        throw new Error("Failed to submit SAP Input");
      }
    } catch (error) {
      updateStatus(`Error: ${error.message}`, "error");
    } finally {
      button.style.backgroundColor = "";
    }
}
  
// Punch In function
async function punchIn(button) {
    button.style.backgroundColor = "#555";

    try {
        const response = await fetch("/api/punchIn", {
            method: "POST",
            headers: { "spreadsheet-id": localStorage.getItem('spreadsheetId') }  // Add spreadsheetId header
        });
        const result = await response.json();

        if (response.ok) {
            updateStatus(result, "success");
        } else {
            updateStatus(result, "error");
        }
    } catch (error) {
        console.error('Error in Punch In:', error);
        updateStatus({ code: 9999, message: "Network error or server is unavailable." }, "error");
    } finally {
        button.style.backgroundColor = "";
    }
}

// Punch Out function
async function punchOut(button) {
    button.style.backgroundColor = "#555";

    try {
        const response = await fetch("/api/punchOut", {
            method: "POST",
            headers: { "spreadsheet-id": localStorage.getItem('spreadsheetId') }  // Add spreadsheetId header
        });
        const result = await response.json();

        if (response.ok) {
            updateStatus(result, "success");
        } else {
            updateStatus(result, "error");
        }
    } catch (error) {
        console.error('Error in Punch Out:', error);
        updateStatus({ code: 9999, message: "Network error or server is unavailable." }, "error");
    } finally {
        button.style.backgroundColor = "";
    }
}

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

    try {
        const response = await fetch(`/api/entries/${encodedDate}`, {
            headers: { "spreadsheet-id": localStorage.getItem('spreadsheetId') }  // Add spreadsheetId header
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
        navigate('editEntriesPage');
    } catch (error) {
        console.error('Error fetching entries:', error);
        updateStatus({ code: 9999, message: "Network error or server is unavailable." }, "error");
    }
}


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
                'spreadsheet-id': localStorage.getItem('spreadsheetId'),  // Add spreadsheetId header
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


let logsData = [];
let currentPage = 1;
const logsPerPage = 10;

// Fetch Logs from the Server
async function fetchLogs() {
    const selectedDate = document.getElementById('logDatePicker').value;
    const searchTerm = document.getElementById('logSearch').value;

    try {
        const response = await fetch(`/api/logs?date=${selectedDate}&search=${encodeURIComponent(searchTerm)}`, {
            headers: { 'Content-Type': 'application/json' }
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
        updateStatus('Error fetching logs.', 'error');
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
