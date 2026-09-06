const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ADMIN LOGIN
|--------------------------------------------------------------------------
*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim()
    });

    if (!admin || !admin.active) {
      return res.status(401).json({
        success: false,
        message: "Invalid administrator credentials."
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid administrator credentials."
      });
    }

    const token = jwt.sign(
      {
        adminId: admin._id.toString(),
        email: admin.email,
        role: admin.role,
        name: admin.name
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "12h"
      }
    );

    res.json({
      success: true,
      message: "Administrator login successful.",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to process administrator login."
    });
  }
});


/*
|--------------------------------------------------------------------------
| CHECK CURRENT ADMIN SESSION
|--------------------------------------------------------------------------
*/
router.get("/me", require("../middleware/auth"), async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.adminId)
      .select("-password");

    if (!admin || !admin.active) {
      return res.status(401).json({
        success: false,
        message: "Administrator account is unavailable."
      });
    }

    res.json({
      success: true,
      admin
    });

  } catch (error) {
    console.error("Session check error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to verify administrator session."
    });
  }
});


module.exports = router;
