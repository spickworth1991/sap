async function testGetSpreadsheet() {
    const spreadsheetId = '19ernax6WLojBLh1OOBaU6IcDuKFxwLB4FL6pNVpqrGI';
    const sheets = await getGoogleSheetsService();
    try {
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        console.log('Spreadsheet Metadata:', metadata.data);
    } catch (error) {
        console.error('Error fetching spreadsheet metadata:', error);
    }
}

testGetSpreadsheet('your-spreadsheet-id');

// Validate JSON format
function isValidJSON(jsonString) {
    try {
        JSON.parse(jsonString);
        return true;
    } catch (error) {
        return false;
    }
  }
  
  // Authenticate with Google Sheets API
  export async function getGoogleSheetsService() {
    try {
        const credentialsString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!isValidJSON(credentialsString)) {
            throw new Error('Invalid JSON format for GOOGLE_SERVICE_ACCOUNT_KEY');
        }
        const credentials = JSON.parse(credentialsString);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        return google.sheets({ version: 'v4', auth });
    } catch (error) {
        console.error('Error parsing GOOGLE_SERVICE_ACCOUNT_KEY:', error);
        throw error;
    }
  }
  
