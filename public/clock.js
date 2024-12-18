// clock.js
console.log('Clock functionality loaded');

// Placeholder for clock-in and clock-out functionality
async function punchIn() {
    try {
        const response = await fetch('/api/clock/in', { method: 'POST' });
        if (!response.ok) throw new Error('Punch-in failed');
        alert('Punch-in successful');
    } catch (error) {
        console.error(error);
        alert('Error during punch-in');
    }
}

async function punchOut() {
    try {
        const response = await fetch('/api/clock/out', { method: 'POST' });
        if (!response.ok) throw new Error('Punch-out failed');
        alert('Punch-out successful');
    } catch (error) {
        console.error(error);
        alert('Error during punch-out');
    }
}