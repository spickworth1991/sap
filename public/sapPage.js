document.addEventListener('DOMContentLoaded', () => {
    const sapInput = document.getElementById('sapButton');
    if (sapInput) {
      sapInput.addEventListener('click', () => sapInput(sapInput)); // Attach click event
    } else {
        console.error('Sap Input Error at button.');
    }
});

// SAP Input function
async function sapInput(button) {
    const inputBox = document.getElementById("inputBox");
    const inputText = inputBox?.value.trim();
  
    if (!inputText) {
      inputBox.classList.add("input-error");
      updateStatus("Please enter some text.", "error");
      return;
    }
    
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const spreadsheetId = localStorage.getItem('spreadsheetId');

    if (!token || !spreadsheetId || !username) {
        alert('You are not logged in!');
        return (window.location.href = 'index.html');
    }

    button.style.backgroundColor = "#555";
  
    try {
      const response = await fetch("/api/sap/input", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Optional
      },
      body: JSON.stringify({ spreadsheetId, username, role }),
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