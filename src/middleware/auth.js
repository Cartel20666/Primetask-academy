const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Administrator authentication required."
      });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded || !decoded.adminId) {
      return res.status(401).json({
        success: false,
        message: "Invalid administrator session."
      });
    }

    req.admin = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Administrator session expired or invalid."
    });

  }
}

module.exports = requireAdmin;
