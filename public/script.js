//console.log("script.js loaded successfully");

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
        statusBox.style.display = "block";

        const duration = type === "success" ? 3000 : 5000;
        setTimeout(() => {
            statusBox.style.display = "none";
        }, duration);
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
        headers: { "Content-Type": "application/json" },
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
        const response = await fetch("/api/punchIn", { method: "POST" });
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
        const response = await fetch("/api/punchOut", { method: "POST" });
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

    const encodedDate = encodeURIComponent(formattedDate); // Encode the date for the URL

    try {
        const response = await fetch(`/api/entries/${encodedDate}`);
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

        data.entries.forEach((entry) => {
            const { rowNumber, values } = entry;
            const entryDiv = document.createElement('div');
            entryDiv.innerHTML = `
                <div>
                    <span>${values.join(' | ')}</span>
                    <button onclick="editEntry('${formattedDate}', ${rowNumber})">Edit</button>
                </div>
            `;
            entriesContainer.appendChild(entryDiv);
        });

        navigate('editEntriesPage');
    } catch (error) {
        console.error('Error fetching entries:', error);
        updateStatus(`Error: ${error.message}`, "error");
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, rowIndex, time: newTime, projectActivity: newProjectActivity }),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            fetchEntriesByDate(); // Refresh entries after update
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error editing entry:', error);
        alert('Error editing entry.');
    }
}

  
