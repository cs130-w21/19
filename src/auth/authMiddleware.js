/* this authentication middleware simply checks if req.user is populated with the session stored data. If not, return a 401..*/
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
