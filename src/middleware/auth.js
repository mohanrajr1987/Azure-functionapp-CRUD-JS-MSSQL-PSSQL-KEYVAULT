const userService = require('../services/userService');
const { logRequest, logException } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

async function authenticate(context, req) {
    const startTime = Date.now();
    const requestId = uuidv4();
    const path = req.url;

    try {
        // Check for Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                status: 401,
                body: { message: 'Access token is required' }
            };
        }

        // Verify token
        const token = authHeader.split(' ')[1];
        const decoded = await userService.verifyToken(token);

        // Get user from database
        const user = await userService.getUser(decoded.userId);

        if (!user) {
            return {
                status: 401,
                body: { message: 'User not found' }
            };
        }

        // Attach user and request tracking info to request
        req.user = user;
        req.tracking = {
            requestId,
            startTime,
            path
        };
        
        logRequest('Authenticated', path, Date.now() - startTime, 200, true, {
            requestId,
            userId: user.id
        });
        
        return null;

    } catch (error) {
        logException(error, {
            requestId,
            path,
            duration: Date.now() - startTime
        });
        
        return {
            status: 401,
            body: { 
                message: 'Invalid or expired token',
                requestId
            }
        };
    }
}

module.exports = { authenticate };
