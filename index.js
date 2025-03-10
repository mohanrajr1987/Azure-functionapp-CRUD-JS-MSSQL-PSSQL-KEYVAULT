const { initializeDatabase, getSequelize } = require('./src/config/database');
const { runMigrations } = require('./src/utils/migration');
const { logEvent, logException } = require('./src/utils/logger');

// Models
const UserModel = require('./src/models/user');

// Initialize all models
const models = {
    User: null
};

function initializeModels(sequelize) {
    models.User = UserModel.defineModel(sequelize);
}

// Initialize middleware
const middleware = {
    authenticate: require('./src/middleware/auth').authenticate
};

// Initialize utilities
const utils = {
    auth: require('./src/utils/auth'),
    logger: require('./src/utils/logger'),
    migration: require('./src/utils/migration')
};

async function initializeApp() {
    try {
        // Set NODE_ENV if not set
        process.env.NODE_ENV = process.env.NODE_ENV || 'development';
        // Initialize database connection
        await initializeDatabase();
        
        logEvent('DatabaseInitialized', {
            timestamp: new Date().toISOString()
        });

        // Run migrations
        const sequelize = getSequelize();
        if (!sequelize) {
            throw new Error('Database initialization failed');
        }
        
        // Initialize models
        initializeModels(sequelize);
        
        // Run migrations
        await runMigrations(sequelize);
        
        logEvent('MigrationsCompleted', {
            timestamp: new Date().toISOString()
        });

        // Sync models with database (only in development)
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            logEvent('ModelsSync', {
                timestamp: new Date().toISOString()
            });
        }

        return {
            models,
            middleware,
            utils,
            sequelize
        };
    } catch (error) {
        logException(error, {
            context: 'initializeApp',
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}

// Export initialization function and components
module.exports = {
    initializeApp,
    models,
    middleware,
    utils
};
