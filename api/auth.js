const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const users = [
  { username: 'admin', password: 'admin123', role: 'admin', spreadsheetId: '19ernax6WLojBLh1OOBaU6IcDuKFxwLB4FL6pNVpqrGI' },
  { username: 'user1', password: 'user123', role: 'user', spreadsheetId: '1RzOAQmsdoWw3Df5G0625RlCpySZpEXx39oAnf0YM4PE' },
  { username: 'spickworth', password: 'test', role: 'admin', spreadsheetId: '1bu86Ld2p1BCXf-wubb9yW26KMigqdZldIeCt_ho12ss' }
];

// Login Route
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Generate JWT
  const token = jwt.sign(
    { username: user.username, role: user.role, spreadsheetId: user.spreadsheetId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

// Middleware to Verify Token
router.use((req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.headers['username'] = decoded.username;
    req.headers['role'] = decoded.role;
    req.headers['spreadsheet-id'] = decoded.spreadsheetId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
