// Punch In function
async function punchIn(button) {
    button.style.backgroundColor = "#555";

    try {
        const response = await fetch("/api/punchIn", {
            method: "POST",
            headers: {
                "spreadsheet-id": localStorage.getItem('spreadsheetId'),
                "username": localStorage.getItem('username'), // Send username in headers
            },
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
            headers: {
                "spreadsheet-id": localStorage.getItem('spreadsheetId'),
                "username": localStorage.getItem('username'), // Send username in headers
            },
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