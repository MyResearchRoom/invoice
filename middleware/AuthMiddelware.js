import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // Check if authorization header exists
    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied, no token provided' });
    }

    // Extract the token from the Bearer string
    const token = authHeader.split(' ')[1]; // Example: Bearer <token>

    if (!token) {
        return res.status(401).json({ message: 'Access denied, token missing' });
    }

    // Verify the token
    jwt.verify(token,process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        // Token is valid, and we can access the decoded payload
        req.user = decoded; // You can use this in subsequent requests (contains id, email, role)

        // Call the next middleware or function in the route
        next();
    });
};


