const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema(
  {
    institution: {
      type: String,
      required: true,
      trim: true,
    },
    degree: {
      type: String,
      required: true,
      trim: true,
    },
    field: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    major: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4.0,
      default: null,
    },
    honors: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    current: {
      type: Boolean,
      default: false,
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    achievements: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],
    projects: [{
      type: String,
      trim: true,
      maxlength: 200,
    }],
    skillsUsed: [{
      type: String,
      trim: true,
      maxlength: 50,
    }],
  },
  { _id: true }
);

const contactSchema = new mongoose.Schema({
  phone: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  linkedin: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
});

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    contact: {
      type: contactSchema,
      required: true,
    },
    education: [
      {
        type: educationSchema,
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    experience: [
      {
        type: experienceSchema,
      },
    ],
    summary: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    languages: [
      {
        name: String,
        proficiency: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "native"],
          default: "intermediate",
        },
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        date: Date,
        expiryDate: Date,
        description: String,
      },
    ],
    projects: [
      {
        name: String,
        description: String,
        technologies: [String],
        link: String,
        startDate: Date,
        endDate: Date,
      },
    ],
    awards: [{
      type: String,
      trim: true,
      maxlength: 200,
    }],
    volunteer: [{
      type: String,
      trim: true,
      maxlength: 200,
    }],
    hobbies: [{
      type: String,
      trim: true,
      maxlength: 100,
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
resumeSchema.index({ userId: 1 });
resumeSchema.index({ templateId: 1 });
resumeSchema.index({ createdAt: -1 });

// Pre-save middleware to update updatedAt
resumeSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Method to get formatted resume data
resumeSchema.methods.getFormattedData = function () {
  return {
    id: this._id,
    name: this.name,
    templateId: this.templateId,
    contact: this.contact,
    education: this.education,
    skills: this.skills,
    experience: this.experience,
    summary: this.summary,
    languages: this.languages,
    certifications: this.certifications,
    projects: this.projects,
    awards: this.awards,
    volunteer: this.volunteer,
    hobbies: this.hobbies,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Static method to find resumes by user
resumeSchema.statics.findByUser = function (userId) {
  return this.find({ userId }).sort({ updatedAt: -1 });
};

module.exports = mongoose.model("Resume", resumeSchema);
