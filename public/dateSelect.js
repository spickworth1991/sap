let formattedDate;

function fetchEntriesByDate() {
    const dateInput = document.getElementById('datePicker').value;
    if (!dateInput) {
        updateStatus("Please select a date.", "error");
        return;
    }

    const [year, month, day] = dateInput.split('-');
    const formattedDate = `${month}/${day}/${year}`;
    window.location.href = `/editentryuser.html?date=${encodeURIComponent(formattedDate)}`;
    
}
