/* this authentication middleware simply checks if req.user is populated with the session stored data. If not, return a 401..*/
/**
* @apiDefine auth
* @apiHeader {String} Cookie connect.sid cookie obtained in /api/accounts/login or /api/accounts/register
* Middleware used to protect routes from unauthorized access
*/
const authMiddleware = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    return res.status(401).json({
      success: false,
      errorMessage: 'Not Authorized / Session expired. Please login.',
    })
  }
};


export default authMiddleware;
