const jwt = require('jsonwebtoken');
const configManager = require('../config/config');

let JWT_SECRET = null;
let JWT_REFRESH_SECRET = null;

async function initializeSecrets() {
    if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
        const jwtConfig = await configManager.getJwtConfig();
        JWT_SECRET = jwtConfig.secret;
        JWT_REFRESH_SECRET = jwtConfig.refreshSecret;
    }
}

const generateTokens = async (user) => {
    await initializeSecrets();
    
    const accessToken = jwt.sign(
        { 
            userId: user.id, 
            email: user.email,
            name: user.name,
            iat: Math.floor(Date.now() / 1000)
        },
        JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { 
            userId: user.id,
            tokenVersion: user.tokenVersion || 0,
            iat: Math.floor(Date.now() / 1000)
        },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

const verifyToken = async (token, isRefreshToken = false) => {
    await initializeSecrets();
    try {
        const secret = isRefreshToken ? JWT_REFRESH_SECRET : JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        
        // Check token expiration
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp <= now) {
            throw new Error('Token has expired');
        }

        return decoded;
    } catch (error) {
        throw new Error(error.message || 'Invalid token');
    }
};

const setCookies = (context, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    context.res.cookies = [
        {
            name: 'refreshToken',
            value: refreshToken,
            httpOnly: true,
            secure: isProduction, // Only use secure in production
            sameSite: 'strict',
            path: '/api/auth', // Restrict cookie to auth endpoints
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        }
    ];
};

const clearCookies = (context) => {
    context.res.cookies = [
        {
            name: 'refreshToken',
            value: '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth',
            maxAge: 0
        }
    ];
};

const createAuthResponse = (user, tokens) => {
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        },
        token: tokens.accessToken,
        expiresIn: 900 // 15 minutes in seconds
    };
};

module.exports = {
    generateTokens,
    verifyToken,
    setCookies,
    clearCookies,
    createAuthResponse
};
