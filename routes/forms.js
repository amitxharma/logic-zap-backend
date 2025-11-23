const express = require("express");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const googleSheetsService = require("../utils/googleSheets");

const router = express.Router();

// Rate limiting for form submissions
const formSubmissionLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: "Too many form submissions, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateContactForm = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
  body("course")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Course name too long"),
  body("subject")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Subject too long"),
  body("message")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Message too long"),
  body("education")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Education qualification too long"),
  body("readyToUpskill")
    .optional()
    .trim()
    .isIn(["yes", "no", ""])
    .withMessage("Invalid value for ready to upskill"),
];

const validateNewsletterForm = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

const validateAuthForm = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("type")
    .isIn(["login", "signup"])
    .withMessage("Type must be either login or signup"),
];

// Helper function to get client info
const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
  userAgent: req.get("User-Agent") || "",
  sourcePage: req.get("Referer") || req.body.sourcePage || "",
});

// Contact form submission
router.post(
  "/contact",
  formSubmissionLimit,
  validateContactForm,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        name,
        email,
        phone,
        course,
        subject,
        message,
        preferredContact,
        courseInterest,
        education,
        readyToUpskill,
      } = req.body;
      const clientInfo = getClientInfo(req);

      const formData = {
        name,
        email,
        phone,
        course,
        subject,
        message,
        preferredContact,
        courseInterest,
        education,
        readyToUpskill,
        sourcePage: clientInfo.sourcePage,
      };

      // Save to Google Sheets
      await googleSheetsService.addContactForm(formData);

      // Send success response
      res.status(200).json({
        success: true,
        message: "Thank you for your message! We will get back to you soon.",
        data: {
          submittedAt: new Date().toISOString(),
          email: email,
        },
      });

      // Log for monitoring
      console.log(
        `Contact form submitted by ${email} from ${clientInfo.ipAddress}`
      );
    } catch (error) {
      console.error("Contact form submission error:", error);
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Newsletter subscription
router.post(
  "/newsletter",
  formSubmissionLimit,
  validateNewsletterForm,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
          errors: errors.array(),
        });
      }

      const { email } = req.body;
      const clientInfo = getClientInfo(req);

      const subscriptionData = {
        email,
        sourcePage: clientInfo.sourcePage,
        ipAddress: clientInfo.ipAddress,
      };

      // Save to Google Sheets
      await googleSheetsService.addNewsletterSubscription(subscriptionData);

      res.status(200).json({
        success: true,
        message: "Successfully subscribed to our newsletter!",
        data: {
          email: email,
          subscribedAt: new Date().toISOString(),
        },
      });

      console.log(
        `Newsletter subscription: ${email} from ${clientInfo.ipAddress}`
      );
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({
        success: false,
        message: "Subscription failed. Please try again later.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Auth form tracking (for signup/login analytics)
router.post("/auth-track", validateAuthForm, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, type } = req.body;
    const clientInfo = getClientInfo(req);

    const authData = {
      name,
      email,
      type,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    };

    // Save to Google Sheets
    await googleSheetsService.addAuthSignup(authData);

    res.status(200).json({
      success: true,
      message: "Auth activity tracked successfully",
    });
  } catch (error) {
    console.error("Auth tracking error:", error);
    res.status(500).json({
      success: false,
      message: "Tracking failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Resume builder activity tracking
router.post("/resume-activity", async (req, res) => {
  try {
    const { name, email, resumeId, action, templateUsed } = req.body;

    const activityData = {
      name,
      email,
      resumeId,
      action, // 'created', 'updated', 'downloaded', 'printed'
      templateUsed,
    };

    await googleSheetsService.addResumeBuilderActivity(activityData);

    res.status(200).json({
      success: true,
      message: "Activity tracked successfully",
    });
  } catch (error) {
    console.error("Resume activity tracking error:", error);
    res.status(500).json({
      success: false,
      message: "Activity tracking failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Admin endpoint to get form submissions (protected route)
router.get("/admin/submissions/:sheetName", async (req, res) => {
  try {
    // Add authentication middleware here if needed
    const { sheetName } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const validSheets = [
      "Auth_Signups",
      "Contact_Forms",
      "Newsletter_Subscriptions",
      "Resume_Builder_Users",
    ];

    if (!validSheets.includes(sheetName)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sheet name",
      });
    }

    const data = await googleSheetsService.getSheetData(sheetName, limit);

    res.status(200).json({
      success: true,
      data: data,
      count: data.length,
    });
  } catch (error) {
    console.error("Admin data fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
