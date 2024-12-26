// Navigation function to show the selected page
export function statusBox(message, type) {
    // Function to update status and hide it after a certain duration

    const statusBox = document.getElementById("statusBox");
  
    if (statusBox) {
        // Reset status classes
        statusBox.classList.remove("success", "error");
        statusBox.classList.add(type);
  
        // Handle message types
        if (typeof message === 'object' && message.code && message.message) {
            statusBox.innerText = `${type === 'error' ? 'Error' : 'Success'} ${message.code}: ${message.message}`;
        } else if (typeof message === 'string') {
            statusBox.innerText = message;
        } else {
            statusBox.innerText = type === 'error' ? 'An unknown error occurred.' : 'Operation successful.';
        }
  
        // Show status box
        statusBox.classList.add("show");
  
        // Hide status box after duration
        setTimeout(() => {
            statusBox.classList.remove("show");
        }, type === "success" ? 3000 : 5000);
    } else {
        console.error('Status box not found.');
    }
  }

export default statusBox;