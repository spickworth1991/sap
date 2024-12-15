// errors.js
module.exports = {
  NO_INPUT_PROVIDED: { code: 1001, message: "No input provided." },
  PUNCH_IN_EXISTS: { code: 1002, message: "Already punched in on this date." },
  NO_PUNCH_IN_FOUND: { code: 1003, message: "No Punch In time found for today." },
  PUNCH_OUT_EXISTS: { code: 1004, message: "Already punched out on this date." },
  NO_ENTRY_FOUND: { code: 1005, message: "No entry found for this date." },
  INVALID_DATE_FORMAT: { code: 1006, message: "Invalid date format provided." },
  UPDATE_FAILED: { code: 1007, message: "Failed to update the entry." },
  FAIL_PUNCH_IN: { code: 1008, message: "An Error occured while punching in." },
  FAIL_PUNCH_OUT: { code: 1009, message: "An Error occured while punching out." },
  SAP_FAIL: { code: 1010, message: "An Error occured while entering SAP info." },
  FETCH_FAIL: { code: 1011, message: "Error fetching entries from SAP page." },
  UNKNOWN_ERROR: { code: 9999, message: "An unknown error occurred." },
};
