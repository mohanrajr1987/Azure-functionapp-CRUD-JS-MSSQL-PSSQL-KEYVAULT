const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

let userModel = null;

function defineModel(sequelize) {
    if (!userModel) {
        userModel = sequelize.define('User', {
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
                unique: true,
                validate: {
                    isEmail: true
                }
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
        }, {
            hooks: {
                beforeCreate: async (user) => {
                    if (user.password) {
                        const salt = await bcrypt.genSalt(10);
                        user.password = await bcrypt.hash(user.password, salt);
                    }
                },
                beforeUpdate: async (user) => {
                    if (user.changed('password')) {
                        const salt = await bcrypt.genSalt(10);
                        user.password = await bcrypt.hash(user.password, salt);
                    }
                }
            }
        });
    }
    return userModel;
}

module.exports = {
    defineModel,
    getModel: () => userModel
};
