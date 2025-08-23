const express = require("express");
const { body, validationResult } = require("express-validator");
const { auth } = require("../middleware/auth");
const Resume = require("../models/Resume");
const User = require("../models/User");
const { generatePDF } = require("../utils/pdfGenerator");

const router = express.Router();

// Validation middleware
const validateResume = [
  body("name").notEmpty().trim().withMessage("Resume name is required"),
  body("templateId").notEmpty().withMessage("Template ID is required"),
  body("contact").isObject().withMessage("Contact information is required"),
  body("contact.phone").optional().isString(),
  body("contact.address").optional().isObject(),
  body("education").isArray().withMessage("Education must be an array"),
  body("skills").isArray().withMessage("Skills must be an array"),
  body("experience").isArray().withMessage("Experience must be an array"),
];

// Create new resume
router.post("/", auth, validateResume, async (req, res) => {
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

    const resumeData = {
      ...req.body,
      userId: req.user._id,
    };

    const resume = new Resume(resumeData);
    await resume.save();

    // Add resume to user's resumes array
    req.user.resumes.push(resume._id);
    await req.user.save();

    res.status(201).json({
      success: true,
      message: "Resume created successfully",
      data: {
        resume: resume.getFormattedData(),
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
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const resume = await Resume.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      { ...req.body, updatedAt: new Date() },
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

    duplicateData.name = `${duplicateData.name} (Copy)`;
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

// Download resume as PDF
router.get("/:id/download", auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate("userId", "name email");

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // Generate PDF
    const pdfBuffer = await generatePDF(resume);

    // Set response headers for file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${resume.name.replace(/\s+/g, "_")}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Download resume error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating PDF",
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
      .select("name updatedAt templateId");

    res.json({
      success: true,
      data: {
        totalResumes,
        recentResumes: recentResumes.map((resume) => ({
          id: resume._id,
          name: resume.name,
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
