const { getModel } = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const configManager = require('../config/config');
const { logEvent, logException } = require('../utils/logger');

class UserService {
    async createUser(userData) {
        try {
            const User = getModel();
            const existingUser = await User.findOne({ where: { email: userData.email } });
            if (existingUser) {
                throw new Error('User already exists');
            }

            const user = await User.create({
                ...userData,
                tokenVersion: 0,
                lastLogin: new Date()
            });
            logEvent('user_created', { userId: user.id });
            return user;
        } catch (error) {
            logException(error);
            throw error;
        }
    }

    async getUser(userId) {
        try {
            const User = getModel();
            const user = await User.findByPk(userId, {
                attributes: { exclude: ['password', 'refreshToken'] }
            });
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            logException(error);
            throw error;
        }
    }

    async updateUser(userId, userData) {
        try {
            const User = getModel();
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }
            
            // Don't allow updating sensitive fields
            delete userData.tokenVersion;
            delete userData.refreshToken;

            if (userData.password) {
                userData.password = await bcrypt.hash(userData.password, 10);
            }

            await user.update(userData);
            logEvent('user_updated', { userId });
            return user;
        } catch (error) {
            logException(error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            const User = getModel();
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            await user.destroy();
            logEvent('user_deleted', { userId });
            return true;
        } catch (error) {
            logException(error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            const User = getModel();
            const user = await User.findOne({
                where: { email },
                attributes: { include: ['password', 'tokenVersion'] }
            });
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            logException(error);
            throw error;
        }
    }

    async validatePassword(user, password) {
        try {
            if (!user || !password) {
                throw new Error('User and password are required');
            }
            return await bcrypt.compare(password, user.password);
        } catch (error) {
            logException(error);
            throw error;
        }
    }


    async login(email, password) {
        try {
            const user = await this.getUserByEmail(email);
            const isValidPassword = await this.validatePassword(user, password);
            
            if (!isValidPassword) {
                throw new Error('Invalid password');
            }

            // Update last login time
            await user.update({ lastLogin: new Date() });

            // Generate new tokens
            const tokens = await this.generateTokens(user);
            logEvent('user_login', { userId: user.id });
            
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    lastLogin: user.lastLogin
                },
                ...tokens
            };
        } catch (error) {
            logException(error);
            throw error;
        }
    }

    async refreshToken(refreshToken) {
        try {
            const jwtConfig = await configManager.getJwtConfig();
            const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
            
            const user = await this.getUser(decoded.userId);
            if (user.tokenVersion !== decoded.tokenVersion) {
                throw new Error('Token has been revoked');
            }

            const tokens = await this.generateTokens(user);
            logEvent('token_refreshed', { userId: user.id });
            
            return tokens;
        } catch (error) {
            logException(error);
            throw error;
        }
    }

    async generateTokens(user) {
        try {
            const jwtConfig = await configManager.getJwtConfig();
            
            const accessToken = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email,
                    name: user.name,
                    iat: Math.floor(Date.now() / 1000)
                },
                jwtConfig.secret,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                { 
                    userId: user.id,
                    tokenVersion: user.tokenVersion || 0,
                    iat: Math.floor(Date.now() / 1000)
                },
                jwtConfig.refreshSecret,
                { expiresIn: '7d' }
            );

            return { accessToken, refreshToken };
        } catch (error) {
            logException(error);
            throw error;
        }
    }

    async verifyToken(token, isRefreshToken = false) {
        try {
            const jwtConfig = await configManager.getJwtConfig();
            const secret = isRefreshToken ? jwtConfig.refreshSecret : jwtConfig.secret;
            
            const decoded = jwt.verify(token, secret);
            const now = Math.floor(Date.now() / 1000);
            
            if (decoded.exp <= now) {
                throw new Error('Token has expired');
            }

            return decoded;
        } catch (error) {
            logException(error);
            throw error;
        }
    }

    setCookies(context, refreshToken) {
        const isProduction = process.env.NODE_ENV === 'production';
        context.res.cookies = [
            {
                name: 'refreshToken',
                value: refreshToken,
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                path: '/api/users',
                maxAge: 7 * 24 * 60 * 60 * 1000
            }
        ];
    }

    clearCookies(context) {
        context.res.cookies = [
            {
                name: 'refreshToken',
                value: '',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/api/users',
                maxAge: 0
            }
        ];
    }
}

module.exports = new UserService();
