
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('fetchUserEntries');
    if (dateInput) {
      dateInput.addEventListener('click', () => fetchEntriesByDate(dateInput)); // Attach click event
    }
});


async function fetchEntriesByDate(button) {
    button.style.backgroundColor = "#555";
    const dateInput = document.getElementById('datePicker').value;
    if (!dateInput) {
        updateStatus("Please select a date.", "error");
        button.style.backgroundColor = "";
        return;
    }

    const [year, month, day] = dateInput.split('-');
    const formattedDate = `${month}/${day}/${year}`;
    window.location.href = `/editentryuser.html?date=${encodeURIComponent(formattedDate)}`;
    
}
