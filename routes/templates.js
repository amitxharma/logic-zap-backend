const express = require("express");
const { auth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Hardcoded resume templates
const resumeTemplates = [
  {
    id: "modern-professional",
    name: "Modern Professional",
    description:
      "Clean and professional design suitable for corporate environments",
    category: "professional",
    previewUrl: "/templates/modern-professional-preview.png",
    features: ["Clean typography", "Professional layout", "Easy to customize"],
    suitableFor: ["entry-level", "intermediate", "advanced"],
    colorScheme: "blue-gray",
  },
  {
    id: "creative-portfolio",
    name: "Creative Portfolio",
    description:
      "Creative and artistic design perfect for designers and artists",
    category: "creative",
    previewUrl: "/templates/creative-portfolio-preview.png",
    features: ["Creative layout", "Colorful design", "Portfolio showcase"],
    suitableFor: ["intermediate", "advanced"],
    colorScheme: "multicolor",
  },
  {
    id: "minimalist-clean",
    name: "Minimalist Clean",
    description: "Simple and clean design focusing on content",
    category: "minimalist",
    previewUrl: "/templates/minimalist-clean-preview.png",
    features: ["Minimal design", "Focus on content", "Easy to read"],
    suitableFor: ["entry-level", "intermediate", "advanced"],
    colorScheme: "black-white",
  },
  {
    id: "executive-classic",
    name: "Executive Classic",
    description: "Traditional executive style for senior professionals",
    category: "executive",
    previewUrl: "/templates/executive-classic-preview.png",
    features: [
      "Executive style",
      "Traditional layout",
      "Senior professional focus",
    ],
    suitableFor: ["advanced"],
    colorScheme: "navy-blue",
  },
  {
    id: "tech-modern",
    name: "Tech Modern",
    description: "Modern tech-focused design for IT professionals",
    category: "technology",
    previewUrl: "/templates/tech-modern-preview.png",
    features: ["Tech-focused design", "Modern layout", "Skill highlighting"],
    suitableFor: ["entry-level", "intermediate", "advanced"],
    colorScheme: "tech-blue",
  },
  {
    id: "academic-research",
    name: "Academic Research",
    description: "Academic style perfect for researchers and academics",
    category: "academic",
    previewUrl: "/templates/academic-research-preview.png",
    features: ["Academic format", "Research focus", "Publication highlighting"],
    suitableFor: ["intermediate", "advanced"],
    colorScheme: "academic-brown",
  },
];

// Get all templates
router.get("/", optionalAuth, (req, res) => {
  try {
    // Filter templates based on user's experience level if authenticated
    let filteredTemplates = resumeTemplates;

    if (req.user && req.user.experienceLevel) {
      filteredTemplates = resumeTemplates.filter((template) =>
        template.suitableFor.includes(req.user.experienceLevel)
      );
    }

    res.json({
      success: true,
      data: {
        templates: filteredTemplates,
        count: filteredTemplates.length,
        totalAvailable: resumeTemplates.length,
      },
    });
  } catch (error) {
    console.error("Get templates error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching templates",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get template by ID
router.get("/:id", optionalAuth, (req, res) => {
  try {
    const template = resumeTemplates.find((t) => t.id === req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Check if user can access this template based on experience level
    if (
      req.user &&
      req.user.experienceLevel &&
      !template.suitableFor.includes(req.user.experienceLevel)
    ) {
      return res.status(403).json({
        success: false,
        message: "This template is not suitable for your experience level",
      });
    }

    res.json({
      success: true,
      data: {
        template,
      },
    });
  } catch (error) {
    console.error("Get template error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching template",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get templates by category
router.get("/category/:category", optionalAuth, (req, res) => {
  try {
    const { category } = req.params;
    const categoryTemplates = resumeTemplates.filter(
      (t) => t.category === category
    );

    if (categoryTemplates.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Filter by experience level if user is authenticated
    let filteredTemplates = categoryTemplates;
    if (req.user && req.user.experienceLevel) {
      filteredTemplates = categoryTemplates.filter((template) =>
        template.suitableFor.includes(req.user.experienceLevel)
      );
    }

    res.json({
      success: true,
      data: {
        templates: filteredTemplates,
        count: filteredTemplates.length,
        category,
      },
    });
  } catch (error) {
    console.error("Get templates by category error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching templates by category",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get template categories
router.get("/categories/list", (req, res) => {
  try {
    const categories = [...new Set(resumeTemplates.map((t) => t.category))];

    res.json({
      success: true,
      data: {
        categories: categories.map((category) => ({
          name: category,
          count: resumeTemplates.filter((t) => t.category === category).length,
        })),
      },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Search templates
router.get("/search/:query", optionalAuth, (req, res) => {
  try {
    const { query } = req.params;
    const searchTerm = query.toLowerCase();

    const searchResults = resumeTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.category.toLowerCase().includes(searchTerm) ||
        template.features.some((feature) =>
          feature.toLowerCase().includes(searchTerm)
        )
    );

    // Filter by experience level if user is authenticated
    let filteredResults = searchResults;
    if (req.user && req.user.experienceLevel) {
      filteredResults = searchResults.filter((template) =>
        template.suitableFor.includes(req.user.experienceLevel)
      );
    }

    res.json({
      success: true,
      data: {
        templates: filteredResults,
        count: filteredResults.length,
        searchQuery: query,
      },
    });
  } catch (error) {
    console.error("Search templates error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching templates",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get recommended templates based on user profile
router.get("/recommendations/user", auth, (req, res) => {
  try {
    const { experienceLevel } = req.user;

    if (!experienceLevel) {
      return res.status(400).json({
        success: false,
        message: "Please set your experience level to get recommendations",
      });
    }

    // Get templates suitable for user's experience level
    const suitableTemplates = resumeTemplates.filter((template) =>
      template.suitableFor.includes(experienceLevel)
    );

    // Sort by relevance (you can implement more sophisticated ranking)
    const recommendedTemplates = suitableTemplates.sort((a, b) => {
      // Prioritize templates that are most suitable for the experience level
      if (a.suitableFor.length === 1 && b.suitableFor.length > 1) return -1;
      if (b.suitableFor.length === 1 && a.suitableFor.length > 1) return 1;
      return 0;
    });

    res.json({
      success: true,
      data: {
        templates: recommendedTemplates.slice(0, 3), // Return top 3 recommendations
        count: Math.min(recommendedTemplates.length, 3),
        experienceLevel,
      },
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recommendations",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

module.exports = router;
