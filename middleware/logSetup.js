// Import modules (using ES Modules syntax)
import morgan from 'morgan';

// Setup the logger to log to the console
const setupLogging = (app) => {
    app.use(morgan('combined'));
};

export default setupLogging;
