const fs = require('fs').promises;
const path = require('path');
const { logEvent, logException } = require('./logger');

async function runMigrations(sequelize) {
    try {
        // Create SequelizeMeta table if it doesn't exist
        const queryInterface = sequelize.getQueryInterface();
        const tables = await queryInterface.showAllTables();
        
        if (!tables.includes('SequelizeMeta')) {
            await queryInterface.createTable('SequelizeMeta', {
                name: {
                    type: sequelize.Sequelize.STRING,
                    primaryKey: true,
                    allowNull: false
                }
            });
        }

        // Get all migration files
        const migrationsDir = path.join(__dirname, '..', 'migrations');
        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files.filter(f => f.endsWith('.js')).sort();

        // Get executed migrations
        const executedMigrations = await sequelize.model('SequelizeMeta').findAll({
            attributes: ['name']
        });
        const executedMigrationNames = new Set(executedMigrations.map(m => m.name));

        // Run pending migrations
        for (const file of migrationFiles) {
            if (!executedMigrationNames.has(file)) {
                const migration = require(path.join(migrationsDir, file));
                
                logEvent('MigrationStarted', { migration: file });
                
                await migration.up(sequelize);
                await sequelize.model('SequelizeMeta').create({ name: file });
                
                logEvent('MigrationCompleted', { migration: file });
            }
        }

        return true;
    } catch (error) {
        logException(error, { context: 'runMigrations' });
        throw error;
    }
}

module.exports = { runMigrations };
