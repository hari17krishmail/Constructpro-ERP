/**
 * Role-based access control middleware.
 *
 * Usage:  authorize('ADMIN', 'ACCOUNTANT')
 * Returns 403 if the authenticated user's role is not in the allowed list.
 * All real security decisions live here — no scattered if-checks in controllers.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { authorize };
