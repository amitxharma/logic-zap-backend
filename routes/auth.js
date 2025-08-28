const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const emailService = require("../utils/emailService");

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Validation middleware
const validateSignup = [
  body("email").isEmail().normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// Register/Signup
router.post("/signup", validateSignup, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new user
    const user = new User({
      email,
      password, // This will be hashed by the virtual setter
      // experienceLevel will be null by default
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: user.getPublicProfile(),
        token,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Login
router.post("/login", validateLogin, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user has password (not Google-only user)
    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message:
          "This account was created with Google. Please use Google login.",
      });
    }

    // Verify password
    const isPasswordValid = user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: user.getPublicProfile(),
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/auth/callback?error=google_auth_failed`,
  }),
  async (req, res) => {
    try {
      const user = req.user;
      console.log("Google callback successful for user:", user.email);

      if (!user) {
        console.error("No user found in Google callback");
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/auth/callback?error=no_user_found`
        );
      }

      // Generate token
      const token = generateToken(user._id);
      console.log("Generated JWT token for user:", user.email);

      // Redirect to frontend with token
      const redirectUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/auth/callback?token=${token}`;

      console.log("Redirecting to:", redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/auth/callback?error=callback_processing_failed`
      );
    }
  }
);

// Get current user profile
router.get("/profile", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile(),
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Update experience level
router.put(
  "/experience-level",
  auth,
  [
    body("experienceLevel")
      .isIn(["entry-level", "intermediate", "advanced"])
      .withMessage("Invalid experience level"),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { experienceLevel } = req.body;

      // Update user's experience level
      req.user.experienceLevel = experienceLevel;
      await req.user.save();

      res.json({
        success: true,
        message: "Experience level updated successfully",
        data: {
          user: req.user.getPublicProfile(),
        },
      });
    } catch (error) {
      console.error("Experience level update error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating experience level",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
);

// Forgot Password - Request reset token
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      // Find user by email
      const user = await User.findOne({ email });

      // Always return success to prevent email enumeration attacks
      // But only send email if user exists
      if (user) {
        // Check if user has a password (not Google-only user)
        if (!user.passwordHash) {
          return res.status(400).json({
            success: false,
            message:
              "This account was created with Google. Please use Google login or contact support.",
          });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Send reset email
        try {
          await emailService.sendPasswordResetEmail(
            email,
            resetToken,
            user.name
          );
          console.log(`Password reset email sent to: ${email}`);
        } catch (emailError) {
          console.error("Email sending failed:", emailError);
          // Clear the reset token if email fails
          user.clearPasswordReset();
          await user.save();

          return res.status(500).json({
            success: false,
            message: "Failed to send reset email. Please try again later.",
          });
        }
      }

      // Always return success message
      res.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Error processing password reset request",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
);

// Reset Password - Set new password with token
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { token, password } = req.body;

      // Hash the token to compare with stored hash
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // Find user with valid reset token
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      // Set new password
      user.password = password; // This will be hashed by the virtual setter
      user.clearPasswordReset();
      await user.save();

      console.log(`Password reset successful for user: ${user.email}`);

      res.json({
        success: true,
        message:
          "Password reset successful. You can now login with your new password.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Error resetting password",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
);

// Verify Reset Token - Check if token is valid (optional endpoint for frontend)
router.get("/verify-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    res.json({
      success: true,
      message: "Reset token is valid",
      data: {
        email: user.email, // Return email for display purposes
      },
    });
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying reset token",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Logout (client-side token removal)
router.post("/logout", auth, async (req, res) => {
  try {
    // Update last login (optional - for tracking)
    await req.user.updateLastLogin();

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

module.exports = router;
