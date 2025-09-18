const mongoose = require("mongoose");

// Basic information schema
const basicsSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  label: { type: String, trim: true },
  image: { type: String, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  url: { type: String, trim: true },
  summary: { type: String, trim: true },
  location: {
    address: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    city: { type: String, trim: true },
    countryCode: { type: String, trim: true },
    region: { type: String, trim: true },
  },
  relExp: { type: String, trim: true },
  totalExp: { type: String, trim: true },
  objective: { type: String, trim: true },
  profiles: [
    {
      network: { type: String, trim: true },
      username: { type: String, trim: true },
      url: { type: String, trim: true },
    },
  ],
});

// Skills schema
const skillsSchema = new mongoose.Schema({
  languages: [{ name: String, level: Number }],
  frameworks: [{ name: String, level: Number }],
  technologies: [{ name: String, level: Number }],
  libraries: [{ name: String, level: Number }],
  databases: [{ name: String, level: Number }],
  practices: [{ name: String, level: Number }],
  tools: [{ name: String, level: Number }],
});

// Work experience schema
const workSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  url: { type: String, trim: true },
  startDate: { type: String, required: true },
  isWorkingHere: { type: Boolean, default: false },
  endDate: { type: String },
  highlights: [{ type: String, trim: true }],
  summary: { type: String, trim: true },
  years: { type: String, trim: true },
});

// Education schema
const educationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  institution: { type: String, required: true, trim: true },
  url: { type: String, trim: true },
  studyType: { type: String, required: true, trim: true },
  area: { type: String, required: true, trim: true },
  startDate: { type: String, required: true },
  isStudyingHere: { type: Boolean, default: false },
  endDate: { type: String },
  score: { type: String, trim: true },
  courses: [{ type: String, trim: true }],
});

// Activities schema
const activitiesSchema = new mongoose.Schema({
  involvements: { type: String, trim: true },
  achievements: { type: String, trim: true },
});

// Volunteer experience schema
const volunteerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  organization: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  url: { type: String, trim: true },
  startDate: { type: String, required: true },
  endDate: { type: String },
  summary: { type: String, trim: true },
  highlights: [{ type: String, trim: true }],
  isVolunteeringNow: { type: Boolean, default: false },
});

// Awards schema
const awardsSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  date: { type: String, required: true },
  awarder: { type: String, required: true, trim: true },
  summary: { type: String, trim: true },
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
      default: "modern",
    },
    resumeName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: "My Resume",
    },
    // AI Resume Builder compatible structure
    basics: {
      type: basicsSchema,
      required: true,
    },
    skills: {
      type: skillsSchema,
      required: true,
    },
    work: [workSchema],
    education: [educationSchema],
    activities: {
      type: activitiesSchema,
      default: {},
    },
    volunteer: [volunteerSchema],
    awards: [awardsSchema],
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

// Method to get formatted resume data compatible with AI Resume Builder
resumeSchema.methods.getFormattedData = function () {
  return {
    id: this._id,
    resumeName: this.resumeName,
    templateId: this.templateId,
    basics: this.basics,
    skills: this.skills,
    work: this.work,
    education: this.education,
    activities: this.activities,
    volunteer: this.volunteer,
    awards: this.awards,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Static method to find resumes by user
resumeSchema.statics.findByUser = function (userId) {
  return this.find({ userId }).sort({ updatedAt: -1 });
};

// Method to create default resume structure
resumeSchema.statics.createDefault = function (userId, userEmail, userName) {
  return new this({
    userId,
    templateId: "modern",
    resumeName: "My Resume",
    basics: {
      name: userName || "Your Name",
      label: "Professional Title",
      email: userEmail,
      phone: "",
      url: "",
      summary: "",
      location: {
        address: "",
        postalCode: "",
        city: "",
        countryCode: "",
        region: "",
      },
      relExp: "",
      totalExp: "",
      objective: "",
      profiles: [],
    },
    skills: {
      languages: [],
      frameworks: [],
      technologies: [],
      libraries: [],
      databases: [],
      practices: [],
      tools: [],
    },
    work: [],
    education: [],
    activities: {
      involvements: "",
      achievements: "",
    },
    volunteer: [],
    awards: [],
  });
};

module.exports = mongoose.model("Resume", resumeSchema);
