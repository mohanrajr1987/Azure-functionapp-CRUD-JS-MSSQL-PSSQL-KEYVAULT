const { Sequelize } = require("sequelize");
const configManager = require('./config');

let sequelize = null;

async function initializeDatabase() {
    try {
        // Get database configuration
        const dbConfig = await configManager.getDatabaseConfig();

        // Initialize Sequelize based on database type
        if (dbConfig.type === 'mssql') {
            sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
                host: dbConfig.server,
                dialect: 'mssql',
                dialectOptions: {
                    options: {
                        encrypt: true
                    }
                },
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                logging: process.env.NODE_ENV === 'development' ? console.log : false
            });
        } else if (dbConfig.type === 'postgres') {
            sequelize = new Sequelize({
                dialect: 'postgres',
                host: dbConfig.host,
                port: dbConfig.port,
                database: dbConfig.database,
                username: dbConfig.user,
                password: dbConfig.password,
                ssl: dbConfig.ssl,
                dialectOptions: dbConfig.ssl ? {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                } : {},
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                logging: process.env.NODE_ENV === 'development' ? console.log : false
            });
        } else {
            throw new Error(`Unsupported database type: ${dbConfig.type}`);
        }

        // Test the connection
        await sequelize.authenticate();
        console.log(`Database connection has been established successfully using ${dbConfig.type}.`);
        
        return sequelize;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
}

module.exports = {
    getSequelize: () => sequelize,
    initializeDatabase
};
