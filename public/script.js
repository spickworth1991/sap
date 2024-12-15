console.log("script.js loaded successfully");

function setMobileClass() {
    if (isMobileDevice() || window.matchMedia("(pointer: coarse)").matches) {
        document.body.classList.add("mobile");
    }
}

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|Mobile/i.test(navigator.userAgent);
}

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
        statusBox.className = type;
        statusBox.innerText = message;
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

        if (response.ok) {
            updateStatus("Punched in successfully!", "success");
        } else {
            throw new Error("Failed to punch in");
        }
    } catch (error) {
        updateStatus(`Error: ${error.message}`, "error");
    } finally {
        button.style.backgroundColor = "";
    }
}

// Punch Out function
async function punchOut(button) {
    button.style.backgroundColor = "#555";

    try {
        const response = await fetch("/api/punchOut", { method: "POST" });

        if (response.ok) {
            updateStatus("Punched out successfully!", "success");
        } else {
            throw new Error("Failed to punch out");
        }
    } catch (error) {
        updateStatus(`Error: ${error.message}`, "error");
    } finally {
        button.style.backgroundColor = "";
    }
}

 async function fetchEntriesByDate() {
    const selectedDate = document.getElementById('dateInput').value;
    const response = await fetch(`/api/entries/${selectedDate}`);
    const data = await response.json();

    const entriesContainer = document.getElementById('entriesContainer');
    entriesContainer.innerHTML = ''; // Clear previous entries

    if (data.entries.length === 0) {
      entriesContainer.innerHTML = '<p>No entries found for this date.</p>';
      return;
    }

    data.entries.forEach((entry, index) => {
      const entryDiv = document.createElement('div');
      entryDiv.innerHTML = `
        <div>
          <span>${entry.join(' | ')}</span>
          <button onclick="editEntry('${selectedDate}', ${index + 2})">Edit</button>
        </div>
      `;
      entriesContainer.appendChild(entryDiv);
    });
  }

  async function editEntry(date, rowIndex) {
    const newTime = prompt('Enter new time (HH:mm:ss):');
    const newProjectActivity = prompt('Enter new project/activity:');

    if (!newTime || !newProjectActivity) {
      alert('Both time and project/activity are required.');
      return;
    }

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
  }



// Load Entries function
async function loadEntries() {
    const date = document.getElementById("datePicker")?.value;
    if (!date) {
        updateStatus("Please select a date.", "error");
        return;
    }

    try {
        const response = await fetch(`/api/viewEditEntries?date=${date}`);

        if (!response.ok) {
            throw new Error("Failed to load entries");
        }

        const entries = await response.json();
        displayEntries(entries);
    } catch (error) {
        updateStatus(`Error: ${error.message}`, "error");
    }
}

// Function to display entries
function displayEntries(entries) {
    const entriesContainer = document.getElementById("entriesContainer");
    if (entriesContainer) {
        entriesContainer.innerHTML = "";

        if (entries.length === 0) {
            entriesContainer.innerText = "No entries found for the selected date.";
            return;
        }

        entries.forEach(entry => {
            const entryDiv = document.createElement("div");
            entryDiv.classList.add("entry");
            entryDiv.innerHTML = `
                <span>Date: ${entry.date}, Time: ${entry.time}, Info: ${entry.info}, Elapsed Time: ${entry.elapsedTime}</span>
                <button class="button edit-button" onclick="editEntry('${entry.date}', ${entry.row}, '${entry.time}')">Edit</button>
            `;
            entriesContainer.appendChild(entryDiv);
        });

        navigate("editEntriesPage");
    }
}

// Edit Entry function
async function editEntry(date, row, currentTime) {
    const newTime = prompt("Enter new time (24-hour format HH:mm:ss):", currentTime);

    if (!newTime) {
        updateStatus("Edit cancelled. No new time entered.", "info");
        return;
    }

    try {
        const response = await fetch("/api/editEntry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, row, newTime })
        });

        if (response.ok) {
            updateStatus("Entry updated successfully!", "success");
            loadEntries();
        } else {
            throw new Error("Failed to update entry");
        }
    } catch (error) {
        updateStatus(`Error: ${error.message}`, "error");
    }
}
