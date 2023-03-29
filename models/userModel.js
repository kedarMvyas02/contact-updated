const mongoose = require("mongoose");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please add the user name"],
    },
    email: {
      type: String,
      required: [true, "Please add the email"],
      unique: [true, "Email address already taken"],
    },
    password: {
      type: String,
      required: [true, "Please fill the password field"],
    },
    passwordResetToken: { type: String },
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = new mongoose.model("User", userSchema);
