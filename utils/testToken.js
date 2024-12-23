
const { decodeToken } = require('./utils/token');

// Mock JWT token for testing (header.payload.signature)
const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJzcHJlYWRzaGVldElkIjoiMTIzNDUifQ.sflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const decoded = decodeToken(mockToken);
console.log('Decoded Token:', decoded);
