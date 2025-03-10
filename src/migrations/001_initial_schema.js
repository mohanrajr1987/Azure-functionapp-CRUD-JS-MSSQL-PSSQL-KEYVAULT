const { DataTypes } = require('sequelize');

async function up(sequelize) {
    // Create Users table
    await sequelize.getQueryInterface().createTable('Users', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        refreshToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        tokenVersion: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    // Create SequelizeMeta table to track migrations
    await sequelize.getQueryInterface().createTable('SequelizeMeta', {
        name: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        }
    });
}

async function down(sequelize) {
    await sequelize.getQueryInterface().dropTable('Users');
    await sequelize.getQueryInterface().dropTable('SequelizeMeta');
}

module.exports = { up, down };
