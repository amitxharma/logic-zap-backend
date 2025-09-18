const express = require("express");
const { body, validationResult } = require("express-validator");
const { auth } = require("../middleware/auth");
const Resume = require("../models/Resume");
const User = require("../models/User");

const router = express.Router();

// Validation middleware for AI Resume Builder structure
const validateResume = [
  body("resumeName")
    .optional()
    .isString()
    .trim()
    .withMessage("Resume name must be a string"),
  body("templateId")
    .optional()
    .isString()
    .withMessage("Template ID must be a string"),
  body("basics").optional().isObject().withMessage("Basics must be an object"),
  body("basics.name")
    .optional()
    .isString()
    .trim()
    .withMessage("Name must be a string"),
  body("basics.email").optional().isEmail().withMessage("Email must be valid"),
  body("skills").optional().isObject().withMessage("Skills must be an object"),
  body("work").optional().isArray().withMessage("Work must be an array"),
  body("education")
    .optional()
    .isArray()
    .withMessage("Education must be an array"),
  body("volunteer")
    .optional()
    .isArray()
    .withMessage("Volunteer must be an array"),
  body("awards").optional().isArray().withMessage("Awards must be an array"),
];

// Create new resume
router.post("/", auth, validateResume, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    // Create resume with default structure if no data provided
    let resumeData;
    if (Object.keys(req.body).length === 0) {
      // Create default resume
      resumeData = Resume.createDefault(
        req.user._id,
        req.user.email,
        req.user.name
      );
    } else {
      resumeData = new Resume({
        ...req.body,
        userId: req.user._id,
      });
    }

    await resumeData.save();

    // Add resume to user's resumes array
    req.user.resumes.push(resumeData._id);
    await req.user.save();

    res.status(201).json({
      success: true,
      message: "Resume created successfully",
      data: {
        resume: resumeData.getFormattedData(),
      },
    });
  } catch (error) {
    console.error("Create resume error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating resume",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get all resumes for current user
router.get("/", auth, async (req, res) => {
  try {
    const resumes = await Resume.findByUser(req.user._id);

    res.json({
      success: true,
      data: {
        resumes: resumes.map((resume) => resume.getFormattedData()),
        count: resumes.length,
      },
    });
  } catch (error) {
    console.error("Get resumes error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching resumes",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get specific resume by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    res.json({
      success: true,
      data: {
        resume: resume.getFormattedData(),
      },
    });
  } catch (error) {
    console.error("Get resume error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching resume",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Update resume
router.put("/:id", auth, validateResume, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const updateData = { ...req.body, updatedAt: new Date() };

    const resume = await Resume.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    res.json({
      success: true,
      message: "Resume updated successfully",
      data: {
        resume: resume.getFormattedData(),
      },
    });
  } catch (error) {
    console.error("Update resume error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating resume",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Delete resume
router.delete("/:id", auth, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // Remove resume from user's resumes array
    req.user.resumes = req.user.resumes.filter(
      (resumeId) => resumeId.toString() !== req.params.id
    );
    await req.user.save();

    res.json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Delete resume error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting resume",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Duplicate resume
router.post("/:id/duplicate", auth, async (req, res) => {
  try {
    const originalResume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!originalResume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // Create duplicate with new name
    const duplicateData = originalResume.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;

    duplicateData.resumeName = `${duplicateData.resumeName} (Copy)`;
    duplicateData.userId = req.user._id;

    const duplicatedResume = new Resume(duplicateData);
    await duplicatedResume.save();

    // Add to user's resumes array
    req.user.resumes.push(duplicatedResume._id);
    await req.user.save();

    res.status(201).json({
      success: true,
      message: "Resume duplicated successfully",
      data: {
        resume: duplicatedResume.getFormattedData(),
      },
    });
  } catch (error) {
    console.error("Duplicate resume error:", error);
    res.status(500).json({
      success: false,
      message: "Error duplicating resume",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get resume statistics
router.get("/stats/overview", auth, async (req, res) => {
  try {
    const totalResumes = await Resume.countDocuments({ userId: req.user._id });
    const recentResumes = await Resume.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("resumeName updatedAt templateId");

    res.json({
      success: true,
      data: {
        totalResumes,
        recentResumes: recentResumes.map((resume) => ({
          id: resume._id,
          name: resume.resumeName,
          updatedAt: resume.updatedAt,
          templateId: resume.templateId,
        })),
      },
    });
  } catch (error) {
    console.error("Get resume stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching resume statistics",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

module.exports = router;
