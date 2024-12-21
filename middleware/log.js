
// middleware/log.js
const logAction = async (req, res, next) => {
    console.log(`Action: ${req.method} ${req.originalUrl}`); // Basic logging example
    next();
};

module.exports = { logAction };
