// Import modules (using ES Modules syntax)

import bcrypt from 'bcrypt';



// User data with hashed passwords
export const users = [
    {
        username: 'pick',
        password: bcrypt.hashSync('123', 10),
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
export const findUserByUsername = (username) => users.find((user) => user.username === username);


