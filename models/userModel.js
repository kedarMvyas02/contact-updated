const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const AppError = require("../middleware/appError");

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

// userSchema.pre("save", function (next) {
//   if (this.password == this.confirmPassword) {
//     next();
//   } else {
//     return next(
//       new AppError("Password and Confirm passwords are not same", 403)
//     );
//   }
// });

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

module.exports = new mongoose.model("User", userSchema);
