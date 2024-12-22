const bcrypt = require('bcrypt');

// User data with hashed passwords
const users = [
    {
        username: 'spickworth',
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        spreadsheetId: '19ernax6WLojBLh1OOBaU6IcDuKFxwLB4FL6pNVpqrGI',
    },
    {
        username: 'user1',
        password: bcrypt.hashSync('user123', 10),
        role: 'user',
        spreadsheetId: '1RzOAQmsdoWw3Df5G0625RlCpySZpEXx39oAnf0YM4PE',
    },
    {
        username: 'user2',
        password: bcrypt.hashSync('user123', 10),
        role: 'user',
        spreadsheetId: '1bu86Ld2p1BCXf-wubb9yW26KMigqdZldIeCt_ho12ss',
    },
];

// Function to find a user by username
const findUserByUsername = (username) => users.find((user) => user.username === username);

module.exports = { users, findUserByUsername };
