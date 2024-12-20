async function fetchEntriesByDate() {
    const dateInput = document.getElementById('datePicker').value;
    if (!dateInput) {
        updateStatus("Please select a date.", "error");
        return;
    }

    const [year, month, day] = dateInput.split('-');
    const formattedDate = `${month}/${day}/${year}`;

    try {
        const response = await fetch(`/api/entries/${encodeURIComponent(formattedDate)}`, {
            headers: { 
                "Content-Type": "application/json",
                "spreadsheet-id": localStorage.getItem('spreadsheetId')
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Save the fetched data to localStorage
        localStorage.setItem('fetchedEntries', JSON.stringify(data.entries));
        localStorage.setItem('selectedDate', formattedDate);

        // Navigate to the page where entries are displayed
        window.location.href = 'editEntries.html';

    } catch (error) {
        console.error('Error fetching entries:', error);
        updateStatus({ code: 9999, message: "Network error or server is unavailable." }, "error");
    }
}