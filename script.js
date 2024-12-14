/* global google */
// eslint-disable-next-line no-undef
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

        // Set timeout based on message type
        const duration = type === "success" ? 3000 : 5000; // Success: 3s, Error: 5s
        setTimeout(() => {
            statusBox.style.display = "none";
        }, duration);
    }
}

// Generic function to darken buttons on click and reset after completion
function handleButtonClick(button, action) {
    button.style.backgroundColor = "#555"; // Darken button while processing
    action()
        .then(() => (button.style.backgroundColor = "")) // Reset button color on success
        .catch(() => (button.style.backgroundColor = "")); // Reset button color on failure
}

// SAP Input function
function sapInput(button) {
    const inputBox = document.getElementById("inputBox");
    const inputText = inputBox?.value.trim();

    if (!inputText) {
        inputBox.classList.add("input-error");
        updateStatus("Please enter some text.", "error");
        return;
    }

    button.style.backgroundColor = "#555"; // Darken button while processing

    google.script.run
        .withSuccessHandler(() => {
            updateStatus("SAP Input submitted successfully!", "success");
            inputBox.value = "";
            inputBox.classList.remove("input-error");
            button.style.backgroundColor = ""; // Reset button color
        })
        .withFailureHandler(error => {
            updateStatus("Error: " + error.message, "error");
            button.style.backgroundColor = ""; // Reset button color
        })
        .sapInput(inputText);
}

// Punch In function
function punchIn(button) {
    button.style.backgroundColor = "#555"; // Darken button while processing

    google.script.run
        .withSuccessHandler(() => {
            updateStatus("Punched in successfully!", "success");
            button.style.backgroundColor = ""; // Reset button color
        })
        .withFailureHandler(error => {
            updateStatus("Error: " + error.message, "error");
            button.style.backgroundColor = ""; // Reset button color
        })
        .punchIn();
}

// Punch Out function
function punchOut(button) {
    button.style.backgroundColor = "#555"; // Darken button while processing

    google.script.run
        .withSuccessHandler(() => {
            updateStatus("Punched out successfully!", "success");
            button.style.backgroundColor = ""; // Reset button color
        })
        .withFailureHandler(error => {
            updateStatus("Error: " + error.message, "error");
            button.style.backgroundColor = ""; // Reset button color
        })
        .punchOut();
}

// Load Entries function
function loadEntries() {
    const date = document.getElementById("datePicker")?.value;
    if (!date) {
        updateStatus("Please select a date.", "error");
        return;
    }

    google.script.run
        .withSuccessHandler(displayEntries)
        .withFailureHandler(error => {
            updateStatus("Error: " + error.message, "error");
        })
        .viewEditEntries(date);
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
                <span>Date: ${entry[0]}, Time: ${entry[1]}, Info: ${entry[2]}, Elapsed Time: ${entry[3]}</span>
                <button class="button edit-button" onclick="editEntry('${entry[0]}', ${entry[4]}, '${entry[1]}')">Edit</button>
            `;
            entriesContainer.appendChild(entryDiv);
        });

        navigate("editEntriesPage");
    }
}

// Edit Entry function
function editEntry(date, row, currentTime) {
    const parts = date.split('/');
    if (parts.length === 3) {
        date = `${parts[2]}-${parts[0]}-${parts[1]}`;
    }

    const newTime = prompt("Enter new time (24-hour format HH:mm:ss):", currentTime);

    if (!newTime) {
        updateStatus("Edit cancelled. No new time entered.", "info");
        return;
    }

    try {
        if (!Number.isInteger(row) || row <= 0) {
            throw new Error("Invalid row number.");
        }
        if (!/^\d{2}:\d{2}:\d{2}$/.test(newTime)) {
            throw new Error("Invalid time format. Expected HH:mm:ss.");
        }

        google.script.run
            .withSuccessHandler(() => {
                updateStatus("Entry updated successfully!", "success");
                loadEntries();
            })
            .withFailureHandler(error => {
                updateStatus("Error: " + error.message, "error");
            })
            .editEntry(date, row, newTime);
    } catch (error) {
        updateStatus("Error: " + error.message, "error");
    }
}