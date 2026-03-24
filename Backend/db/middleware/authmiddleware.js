const jwt = require('jsonwebtoken');

const authmiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({ message: "Access token required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: "Access token expired", 
                code: "TOKEN_EXPIRED" 
            });
        }
        return res.status(403).json({ message: "Invalid access token" });
    }
};

module.exports = authmiddleware;