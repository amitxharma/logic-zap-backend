const express = require("express");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const googleSheetsService = require("../utils/googleSheets");

const router = express.Router();

// // Rate limiting for form submissions
// const formSubmissionLimit = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 requests per windowMs
//   message: {
//     error: "Too many form submissions, please try again later.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

const formSubmissionLimit = (req, res, next) => next();

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
    .trim()
    .isLength({ min: 10, max: 15 })
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
  body("modalId")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Modal ID too long"),
  body("collegeName")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("College name too long"),
  body("companyName")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Company name too long"),
  body("requirements")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Requirements too long"),
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
  sourcePage: req.body.sourcePage || req.get("Referer") || "",
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
        modalId,
        collegeName,
        companyName,
        requirements,
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
        modalId,
        collegeName,
        companyName,
        requirements,
        sourcePage: clientInfo.sourcePage,
      };

      // Save to Google Sheets with modalId routing
      await googleSheetsService.addContactForm(formData, modalId);

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

// Mentor application submission
const validateMentorApplication = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("phone")
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Please provide a valid phone number"),
  body("qualification")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Qualification must be between 2 and 200 characters"),
  body("experience")
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage("Experience must be between 2 and 500 characters"),
];

router.post(
  "/mentor-application",
  formSubmissionLimit,
  validateMentorApplication,
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

      const { name, email, phone, qualification, experience } = req.body;
      const clientInfo = getClientInfo(req);

      const applicationData = {
        name,
        email,
        phone,
        qualification,
        experience,
        sourcePage: clientInfo.sourcePage,
      };

      // Save to Google Sheets
      await googleSheetsService.addMentorApplication(applicationData);

      res.status(200).json({
        success: true,
        message:
          "Thank you for applying as a mentor! We will review your application and get back to you soon.",
        data: {
          submittedAt: new Date().toISOString(),
          email: email,
        },
      });

      console.log(
        `Mentor application submitted by ${email} from ${clientInfo.ipAddress}`
      );
    } catch (error) {
      console.error("Mentor application submission error:", error);
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Mentor booking submission
const validateMentorBooking = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("phone")
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Please provide a valid phone number"),
  body("qualification")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Qualification must be between 2 and 200 characters"),
  body("domain")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Domain must be between 2 and 200 characters"),
  body("experience")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Experience is required"),
  body("mentorName").trim().notEmpty().withMessage("Mentor name is required"),
  body("selectedSlot").trim().notEmpty().withMessage("Time slot is required"),
  body("selectedPlan")
    .trim()
    .notEmpty()
    .withMessage("Plan selection is required"),
];

router.post(
  "/mentor-booking",
  formSubmissionLimit,
  validateMentorBooking,
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
        qualification,
        domain,
        experience,
        mentorName,
        mentorId,
        selectedSlot,
        selectedPlan,
        planPrice,
      } = req.body;
      const clientInfo = getClientInfo(req);

      const bookingData = {
        name,
        email,
        phone,
        qualification,
        domain,
        experience,
        mentorName,
        mentorId,
        selectedSlot,
        selectedPlan,
        planPrice,
        sourcePage: clientInfo.sourcePage,
      };

      // Save to Google Sheets
      await googleSheetsService.addMentorBooking(bookingData);

      res.status(200).json({
        success: true,
        message:
          "Booking confirmed! We will contact you shortly to finalize your session.",
        data: {
          submittedAt: new Date().toISOString(),
          email: email,
          mentorName: mentorName,
          selectedSlot: selectedSlot,
        },
      });

      console.log(
        `Mentor booking: ${email} booked ${mentorName} for ${selectedSlot} from ${clientInfo.ipAddress}`
      );
    } catch (error) {
      console.error("Mentor booking submission error:", error);
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

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
      "Mentor_Applications",
      "Mentor_Booking",
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
