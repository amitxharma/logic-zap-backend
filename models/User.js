const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    passwordHash: {
      type: String,
      required: function () {
        return !this.googleId; // Password is required only if not Google user
      },
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    name: {
      type: String,
      required: function () {
        return this.googleId; // Name is required for Google users
      },
    },
    experienceLevel: {
      type: String,
      enum: ["entry-level", "intermediate", "advanced"],
      default: null,
    },
    resumes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resume",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

// Virtual for password (not stored in DB)
userSchema.virtual("password").set(function (password) {
  this.passwordHash = bcrypt.hashSync(password, 12);
});

// Method to compare password
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

// Method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Pre-save middleware to hash password if modified
userSchema.pre("save", function (next) {
  if (
    this.isModified("passwordHash") &&
    !this.passwordHash.startsWith("$2a$")
  ) {
    this.passwordHash = bcrypt.hashSync(this.passwordHash, 12);
  }
  next();
});

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    experienceLevel: this.experienceLevel,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
  };
};

module.exports = mongoose.model("User", userSchema);
