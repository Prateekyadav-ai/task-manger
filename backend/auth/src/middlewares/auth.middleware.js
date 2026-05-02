const userModel = require('../models/user.models');
const jwt = require('jsonwebtoken');



async function authMiddleware(req, res, next) {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization.split(' ');
        if (authHeader[0] === 'Bearer' && authHeader[1]) {
            token = authHeader[1];
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const jwtSecret = process.env.jwt_secret || 'test_jwt_secret';
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

}
module.exports = {
    authMiddleware
}