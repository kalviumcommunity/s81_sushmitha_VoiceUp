const User = require('../../models/UserSchema');

/**
 * Role-based authorization middleware
 * @param {Array|String} allowedRoles - Array of roles or single role that can access the route
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
    // Normalize to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    return async (req, res, next) => {
        try {
            // Ensure user is authenticated first
            if (!req.user || !req.user.id) {
                return res.status(401).json({ 
                    message: "Authentication required" 
                });
            }

            // Fetch user from database to get current role
            const user = await User.findById(req.user.id).select('role');
            
            if (!user) {
                return res.status(401).json({ 
                    message: "User not found" 
                });
            }

            // Check if user's role is in allowed roles
            if (!roles.includes(user.role)) {
                return res.status(403).json({ 
                    message: "Insufficient permissions",
                    required: roles,
                    current: user.role
                });
            }

            // Add user role to request for further use
            req.userRole = user.role;
            next();

        } catch (error) {
            console.error("Role authorization error:", error);
            res.status(500).json({ 
                message: "Authorization check failed",
                error: error.message 
            });
        }
    };
};

/**
 * Predefined role middleware functions for common use cases
 */
const roleMiddleware = {
    // Admin only access
    adminOnly: requireRole('admin'),
    
    // Organizer and above (admin, organizer)
    organizerAndAbove: requireRole(['admin', 'organizer']),
    
    // Advocate and above (admin, organizer, advocate)
    advocateAndAbove: requireRole(['admin', 'organizer', 'advocate']),
    
    // All authenticated users
    authenticatedUser: requireRole(['admin', 'organizer', 'advocate', 'user']),
    
    // Content creators (can create campaigns, petitions)
    contentCreator: requireRole(['admin', 'organizer', 'advocate']),
    
    // Event managers (can create and manage events)
    eventManager: requireRole(['admin', 'organizer']),
    
    // Custom role checker
    custom: requireRole
};

/**
 * Middleware to check if user owns a resource or has admin privileges
 * @param {String} resourceUserField - Field name in the resource that contains the user ID
 * @returns {Function} Express middleware function
 */
const requireOwnershipOrAdmin = (resourceUserField = 'createdBy') => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ 
                    message: "Authentication required" 
                });
            }

            const user = await User.findById(req.user.id).select('role');
            
            if (!user) {
                return res.status(401).json({ 
                    message: "User not found" 
                });
            }

            // Admin can access everything
            if (user.role === 'admin') {
                req.userRole = user.role;
                return next();
            }

            // For other users, check ownership
            // This assumes the resource ID is in req.params and the resource is available in req.resource
            // The calling route should populate req.resource before using this middleware
            if (req.resource && req.resource[resourceUserField]) {
                if (req.resource[resourceUserField].toString() === req.user.id) {
                    req.userRole = user.role;
                    return next();
                }
            }

            return res.status(403).json({ 
                message: "Access denied. You can only access your own resources or need admin privileges." 
            });

        } catch (error) {
            console.error("Ownership authorization error:", error);
            res.status(500).json({ 
                message: "Authorization check failed",
                error: error.message 
            });
        }
    };
};

module.exports = {
    requireRole,
    roleMiddleware,
    requireOwnershipOrAdmin
};