const userService = require('../services/userService');
const { logRequest } = require('../utils/logger');

class UserController {
    async createUser(context, req) {
        try {
            // Validate required fields
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return {
                    status: 400,
                    body: { error: 'Name, email, and password are required' }
                };
            }

            const user = await userService.createUser(req.body);
            logRequest('createUser', req.url, 201, true);
            
            return {
                status: 201,
                body: {
                    message: 'User created successfully',
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                }
            };
        } catch (error) {
            logRequest('createUser', req.url, 400, false, { error: error.message });
            
            // Handle different types of errors
            let status = 400;
            if (error.message === 'User already exists') {
                status = 409;
            } else if (error.message.includes('Invalid email format')) {
                status = 422;
            } else if (error.message.includes('Password must')) {
                status = 422;
            }
            
            return {
                status,
                body: { error: error.message }
            };
        }
    }

    async getUser(context, req) {
        try {
            const user = await userService.getUser(req.params.id);
            logRequest('getUser', req.url, 200, true);
            
            return {
                status: 200,
                body: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            };
        } catch (error) {
            logRequest('getUser', req.url, 404, false, { error: error.message });
            
            return {
                status: 404,
                body: { error: error.message }
            };
        }
    }

    async updateUser(context, req) {
        try {
            const user = await userService.updateUser(req.params.id, req.body);
            logRequest('updateUser', req.url, 200, true);
            
            return {
                status: 200,
                body: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            };
        } catch (error) {
            logRequest('updateUser', req.url, 400, false, { error: error.message });
            
            return {
                status: error.message === 'User not found' ? 404 : 400,
                body: { error: error.message }
            };
        }
    }

    async deleteUser(context, req) {
        try {
            await userService.deleteUser(req.params.id);
            logRequest('deleteUser', req.url, 200, true);
            
            return {
                status: 200,
                body: { message: 'User deleted successfully' }
            };
        } catch (error) {
            logRequest('deleteUser', req.url, 404, false, { error: error.message });
            
            return {
                status: 404,
                body: { error: error.message }
            };
        }
    }
    async login(context, req) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            const result = await userService.login(email, password);
            userService.setCookies(context, result.refreshToken);
            logRequest('login', req.url, 200, true);

            return {
                status: 200,
                body: {
                    user: result.user,
                    accessToken: result.accessToken
                }
            };
        } catch (error) {
            logRequest('login', req.url, 401, false, { error: error.message });
            
            return {
                status: 401,
                body: { error: error.message }
            };
        }
    }

    async refreshToken(context, req) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                throw new Error('Refresh token is required');
            }

            const tokens = await userService.refreshToken(refreshToken);
            userService.setCookies(context, tokens.refreshToken);
            logRequest('refreshToken', req.url, 200, true);

            return {
                status: 200,
                body: { accessToken: tokens.accessToken }
            };
        } catch (error) {
            logRequest('refreshToken', req.url, 401, false, { error: error.message });
            
            return {
                status: 401,
                body: { error: error.message }
            };
        }
    }

    async logout(context, req) {
        try {
            userService.clearCookies(context);
            logRequest('logout', req.url, 200, true);

            return {
                status: 200,
                body: { message: 'Logged out successfully' }
            };
        } catch (error) {
            logRequest('logout', req.url, 500, false, { error: error.message });
            
            return {
                status: 500,
                body: { error: error.message }
            };
        }
    }
}

module.exports = new UserController();
