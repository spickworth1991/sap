
document.addEventListener('DOMContentLoaded', () => {
    const pages = {
        loginPage: document.getElementById('login-page'),
        homePage: document.getElementById('home-page'),
        clockPage: document.getElementById('clockPage'),
        sapPage: document.getElementById('sapPage'),
        dateSelectionPage: document.getElementById('dateSelectionPage'),
        editEntriesPage: document.getElementById('editEntriesPage')
    };


    showInitialPage(pages);
    
});

function hideAllPages(pages) {
    Object.values(pages).forEach(page => {
        if (page) {
            page.style.display = 'none';
        }
    });
    window.hideAllPages = hideAllPages;
}


// Show the appropriate page based on login status
function showInitialPage() {
    const adminHomeBtn = document.getElementById('admin-home-btn');
    const userRole = localStorage.getItem('role');
    console.log(`userRole: ${userRole}`);
    const loginPage = document.getElementById('login-page');
    const homePage = document.getElementById('home-page');
    

   // hideAllPages(pages);
    if (userRole) {     
            homePage.style.display = 'block';
            loginPage.style.display = 'none';
        
        if (userRole === 'admin' && adminHomeBtn) {
            adminHomeBtn.style.display = 'inline-block';
        }
    } else {
        if (loginPage) {
            loginPage.style.display = 'block';
            homePage.style.display = 'none';

        }
    }
    window.showInitialPage = showInitialPage;
}

// Navigation function to show the selected page
function navigateTo(pageId) {
    switch (pageId) {
        case 'homePage':
            window.location.href = 'homePage.html';
            break;
        case 'manageUsersPage':
            window.location.href = 'manage_users.html';
            break;
        case 'viewLogsPage':
            window.location.href = 'view_logs.html';
            break;
        case 'editEntriesPage':
            window.location.href = 'edit_entries.html';
            break;
        case 'clockPage':
            window.location.href = 'clockPage.html';
            break;
        case 'sapPage':
            window.location.href = 'sapPage.html';
            break;
        case 'dateSelectionPage':
            window.location.href = 'dateSelect.html';
            break;
        case 'adminPage':
            window.location.href = 'admin.html';
            break;
        default:
            console.log(`Page not found: ${pageId}`);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});





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
        navigateTo('editEntriesPage');
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


