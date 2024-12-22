// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT with spreadsheet ID
    const token = jwt.sign(
        { username: user.username, role: user.role, spreadsheetId: user.spreadsheetId },
        SECRET_KEY,
        { expiresIn: '1h' }
    );
    res.json({ token });
});

module.exports = router;