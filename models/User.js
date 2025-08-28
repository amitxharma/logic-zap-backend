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
      default: undefined,
      required: false,
      validate: {
        validator: function (value) {
          // Allow null/undefined values or valid enum values
          if (value === null || value === undefined || value === "") {
            return true;
          }
          return ["entry-level", "intermediate", "advanced"].includes(value);
        },
        message:
          "Experience level must be entry-level, intermediate, or advanced",
      },
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
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
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

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const crypto = require("crypto");

  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire time (10 minutes)
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Method to clear password reset fields
userSchema.methods.clearPasswordReset = function () {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpires = undefined;
};

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
