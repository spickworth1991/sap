
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('fetchUserEntries');
    if (dateInput) {
      dateInput.addEventListener('click', () => fetchEntriesByDate(dateInput)); // Attach click event
    } else {
        console.error('Sap Input Error at button.');
    }
});


async function fetchEntriesByDate(button) {
    const dateInput = document.getElementById('datePicker').value;
    if (!dateInput) {
        updateStatus("Please select a date.", "error");
        return;
    }

    const [year, month, day] = dateInput.split('-');
    const formattedDate = `${month}/${day}/${year}`;
    window.location.href = `/editentryuser.html?date=${encodeURIComponent(formattedDate)}`;
    
}
