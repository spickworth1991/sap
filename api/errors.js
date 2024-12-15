// errors.js
module.exports = {
    PUNCH_IN_EXISTS: (date) => `Already punched in on ${date}`,
    NO_PUNCH_IN_FOUND: 'No Punch In found for today.',
    NO_PUNCH_IN_TIME: 'No Punch In time found for today.',
    NO_INPUT_PROVIDED: 'No input provided for SAP entry.',
    SHEET_NOT_FOUND: (sheetName) => `Sheet ${sheetName} not found.`,
    UNKNOWN_ERROR: 'Unknown error occurred.',
  };
  