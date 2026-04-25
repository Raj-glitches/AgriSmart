/**
 * Role-based Access Control Middleware
 * Restricts routes to specific user roles
 */

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
};

// Common role combinations for convenience
export const farmerOnly = authorize('farmer');
export const buyerOnly = authorize('buyer');
export const expertOnly = authorize('expert');
export const adminOnly = authorize('admin');
export const farmerOrAdmin = authorize('farmer', 'admin');
export const anyUser = authorize('farmer', 'buyer', 'admin', 'expert');

