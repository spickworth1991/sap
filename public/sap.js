// sap.js
console.log('SAP functionality loaded');

// Placeholder for SAP data input
async function submitSAPData(data) {
    try {
        const response = await fetch('/api/sap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('SAP submission failed');
        alert('SAP data submitted successfully');
    } catch (error) {
        console.error(error);
    }
}