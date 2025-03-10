const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

module.exports = async function (context, req) {
    const route = req.params.route;
    const id = req.params.id;

    // Handle auth routes without authentication
    if (route && ['login', 'refresh', 'logout'].includes(route)) {
        switch (req.params.route) {
            case 'login':
                if (req.method !== 'POST') {
                    context.res = {
                        status: 405,
                        body: { error: 'Method not allowed' }
                    };
                    return;
                }
                context.res = await userController.login(context, req);
                return;
            
            case 'refresh':
                if (req.method !== 'POST') {
                    context.res = {
                        status: 405,
                        body: { error: 'Method not allowed' }
                    };
                    return;
                }
                context.res = await userController.refreshToken(context, req);
                return;
            
            case 'logout':
                if (req.method !== 'POST') {
                    context.res = {
                        status: 405,
                        body: { error: 'Method not allowed' }
                    };
                    return;
                }
                context.res = await userController.logout(context, req);
                return;
            
            default:
                context.res = {
                    status: 404,
                    body: { error: 'Route not found' }
                };
                return;
        }
    }
    try {
        // For non-auth routes, require authentication
        if (!['login', 'refresh', 'logout'].includes(route)) {
            const authResult = await authenticateToken(context, req);
            if (authResult.status !== 200) {
                context.res = authResult;
                return;
            }
        }

        // Handle user creation without authentication
        if (req.method === 'POST' && !route && !id) {
            context.res = await userController.createUser(context, req);
            return;
        }

        // Route to appropriate controller method based on method and route
        switch (req.method) {
            case 'GET':
                if (id) {
                    context.res = await userController.getUser(context, req);
                } else {
                    context.res = {
                        status: 400,
                        body: { error: 'User ID is required' }
                    };
                }
                break;
            
            case 'PUT':
                if (id) {
                    context.res = await userController.updateUser(context, req);
                } else {
                    context.res = {
                        status: 400,
                        body: { error: 'User ID is required' }
                    };
                }
                break;
            
            case 'DELETE':
                if (id) {
                    context.res = await userController.deleteUser(context, req);
                } else {
                    context.res = {
                        status: 400,
                        body: { error: 'User ID is required' }
                    };
                }
                break;
            
            default:
                context.res = {
                    status: 405,
                    body: { error: 'Method not allowed' }
                };
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: { error: 'Internal server error' }
        };
    }
};
