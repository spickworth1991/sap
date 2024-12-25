
document.addEventListener('DOMContentLoaded', () => {
    const punchIn = document.getElementById('punchInButton');
    if (punchIn) {
        punchIn.addEventListener('click', () => punchInHandler(punchIn)); // Attach click event
    } else {
        console.error('Punch In button not found.');
    }

    const punchOut = document.getElementById('punchOutButton');
    if (punchOut) {
        punchOut.addEventListener('click', () => punchOutHandler(punchOut)); // Attach click event
    } else {
        console.error('Punch Out button not found.');
    }
});

// Punch In function
export async function punchInHandler(button) {
    button.style.backgroundColor = "#555";

    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    const spreadsheetId = localStorage.getItem('spreadsheetId');

    if (!token || !spreadsheetId || !username) {
        alert('You are not logged in!');
        window.location.href = 'index.html';
        return;
    }

    try {
        const sheets = await getGoogleSheetsService();
        const currentDate = getCurrentDate();
        const currentTime = getCurrentTime();
        const monthName = getCurrentMonthName();
        const sapSheetName = `${monthName}:SAP`;

        // Find the row with the current date on the month sheet
        const rowIndex = await findDateRow(sheets, monthName, currentDate, spreadsheetId);
        console.log(`rowIndex: ${rowIndex}`);

        if (rowIndex === null) {
            return res.status(400).json({ message: 'No entry found for the current date.' });
        }

        // Check if Punch In time already exists in Column C
        const punchInResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${monthName}!C${rowIndex}`,
        });

        console.log(`punchInResponse: ${punchInResponse}`);

        if (punchInResponse.data.values?.[0]?.[0]) {
            return res.status(400).json({ message: 'Punch In time already exists.' });
        }

        // Update the Punch In time in Column C on the month sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${monthName}!C${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentTime]] },
        });

        // Ensure headers are present in the SAP sheet
        await ensureHeaders(sheets, sapSheetName, currentDate, spreadsheetId);

        // Add Punch In entry to the SAP sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sapSheetName}!A:E`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentDate, currentTime, 'Punch In', '', '']] },
        });

        return res.status(200).json({ message: 'Punch-in successful.' });
    } catch (error) {
        console.error('Error in Punch In:', error);
        return res.status(500).json({ error: 'An error occurred during Punch In.' });
    } finally {
        button.style.backgroundColor = "";
    }
}

// Punch Out function
export async function punchOutHandler(button) {
    button.style.backgroundColor = "#555";

    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    const spreadsheetId = localStorage.getItem('spreadsheetId');

    if (!token || !spreadsheetId || !username) {
        alert('You are not logged in!');
        window.location.href = 'index.html';
        return;
    }

    try {
        const sheets = await getGoogleSheetsService();
        const currentDate = getCurrentDate();
        const currentTime = getCurrentTime();
        const monthName = getCurrentMonthName();
        const sapSheetName = `${monthName}:SAP`;

        // Find the row with the current date on the month sheet
        const rowIndex = await findDateRow(sheets, monthName, currentDate, spreadsheetId);

        if (!rowIndex) {
            return res.status(400).json({ message: 'No entry found for the current date.' });
        }

        // Check if Punch Out time already exists in Column E
        const punchOutResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${monthName}!E${rowIndex}`,
        });

        if (punchOutResponse.data.values?.[0]?.[0]) {
            return res.status(400).json({ message: 'Punch Out time already exists.' });
        }

        // Check if Punch In time exists in Column C
        const punchInResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${monthName}!C${rowIndex}`,
        });

        const punchInTime = punchInResponse.data.values?.[0]?.[0];

        if (!punchInTime) {
            return res.status(400).json({ message: 'No Punch In time found.' });
        }

        // Update the Punch Out time in Column E on the month sheet
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${monthName}!E${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentTime]] },
        });

        // Calculate elapsed time and SAP time, then update the SAP sheet
        const elapsed = calculateElapsedTimeDecimal(punchInTime, currentTime);
        const elapsedFormatted = formatElapsedTime(elapsed);

        // Append totals and Punch Out entry to the SAP sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sapSheetName}!A:E`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentDate, currentTime, 'Punch Out', elapsedFormatted, elapsed]] },
        });

        res.status(200).json({ message: 'Punch Out successful.' });
    } catch (error) {
        console.error('Error in Punch Out:', error);
        res.status(500).json({ message: 'Failed to Punch Out. Please try again.' });
    } finally {
        button.style.backgroundColor = "";
    }
}
