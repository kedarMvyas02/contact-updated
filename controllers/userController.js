const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const crypto = require("crypto");
const sendEmail = require("../models/nodeMailer");
const Contact = require("../models/contactModel");
const AppError = require("../middleware/appError");
// const multer = require("multer");
// const sharp = require("sharp");

////////////////////////////////////////////////////////////////

const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
const hashToken = (token) => {
  const sha256 = crypto.createHash("sha256");
  sha256.update(token);
  return sha256.digest("hex");
};

////////////////////////////////////////////////////////////////
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img");
//   },
//   filename: (req, file, cb) => {
//     const extension = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });

////////////////////////////////////////////////////////////////

// const multerStorage = multer.memoryStorage();

// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith("image")) {
//     cb(null, true);
//   } else {
//     cb(new AppError("Not an image!, please upload images only", 400), false);
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });
// ////////////////////////////////////////////////////////////////
// const uploadUserPhoto = upload.single("photo");
// ////////////////////////////////////////////////////////////////
// const resizeUserPhoto = (req, res, next) => {
//   if (!req.file) {
//     return next(new AppError("Photo is not uploaded in the directory", 400));
//   }
//   req.file.fileName = `user-${req.user.id}-${Date.now()}`;
//   sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat("jpeg")
//     .jpeg({ quality: 90 })
//     .toFile(`public / img / ${req.file.fileName}`);
//   next();
// };
////////////////////////////////////////////////////////////////

const registerUser = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Hash Password

  const hashedPassword = await bcrypt.hash(password, 10);

  // create user in mongoDB

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  // if successfully user created then only show
  // response to the user (so if statement is kept)

  res.status(201).json({
    _id: user.id, // only id and email address would
    email: user.email, // be shown to user as response
  });
});

////////////////////////////////////////////////////////////////

const loginUser = asyncHandler(async (req, res, next) => {
  // first of all we have to fetch what user typed inside body

  const { email, password } = req.body;

  // finding userEMail(P) and checking if it is not present
  // inside our DB, if not tell to register

  const userEmail = await User.findOne({ email });

  if (!userEmail) {
    return next(new AppError("Email is not registered yet", 400));
  }

  // once we found user's email from database (we store that in var)
  // as that variable will stay inside that block and we can get
  // all info of that block through it (including pass with dot keyword)
  // hence we were able to use, userEMail(P).password lol

  const decryptedPass = await bcrypt.compare(password, userEmail.password);

  // now since bcrypt.compare provides a boolean value
  // so here if they are same then decryptedPass is a truthy value

  // now if decryptedPass is a truthy value, we have to give
  // them a jwt token (hooray)

  if (decryptedPass) {
    // access token making is in process
    const accessToken = jwt.sign(
      // we have to pass a payload inside object in sign method
      // payload's data can be exposed easily from jwt.io website
      // so we usually  only pass the user id, and not other imp
      // details here
      {
        id: userEmail._id,
      }, // now we have to pass a secret key
      // who tf knows y
      // (edit): ACCESS_TOKEN_SECRET is used to verify the token is
      // real or not and if slightly changed, jwt's methods will
      // identify malicious activities if done
      process.env.ACCESS_TOKEN_SECRET,
      // now since token is generated, we have to pass an
      // expiration time of that particular token
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    // trying to implement cookie here
    // const cookieOptions = {
    //   expires: new Date(
    //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    //   ),
    //   // secure: true, // cookie will be only sent on an encrypted connection
    //   httpOnly: true, // to prevent cross site request forgery
    // };

    // res.cookie("jwt", accessToken, cookieOptions);

    // sending access token as response

    res.status(200).json({ accessToken });
  } else {
    return next(new AppError("Your password is incorrect", 401));
  }
});

//////////////////////////////////////////////////////////////
const logOut = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const decryptedPass = await bcrypt.compare(password, req.user.password);
  if (req.user.email === email && decryptedPass) {
    res.status(200).json({
      msg: "You have successfully logged out :)",
      accessToken: "",
    });
  } else {
    return next(new AppError("u entered wrong email or password", 401));
  }
});
//////////////////////////////////////////////////////////////

const currentUser = asyncHandler(async (req, res, next) => {
  // in order to validate the real token, we made
  // a middleware, which will help to validate user
  // idk how
  //(edit): ik now, that how it is done lol

  // ok here
  // we first fetch the email and password we wrote in body
  const { email, password } = req.body;

  // now we will compare the req.body 's password with the token's password
  // so the token will be only of the bearer and we store his details in req.user
  // so we write here req.user.password , email
  // we can also fetch username, _id, createdAt, updatedAt , etc
  const decryptedPass = await bcrypt.compare(password, req.user.password);
  if (req.user.email === email && decryptedPass) {
    res.status(200).json(req.user);
  } else {
    return next(new AppError("u entered wrong email or password", 401));
  }

  /*
  res.status(200).json({
    id: findingEmail._id,
    username: findingEmail.username,
    email: findingEmail.email,
  });
  */
});

//////////////////////////////////////////////

const deleteUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email) {
    return next(new AppError("Email is mandatory", 400));
  } else if (!password) {
    return next(new AppError("Password field is mandatory", 400));
  }

  const userEmail = await User.findOne({ email });

  if (!userEmail) {
    return next(new AppError("Email is not registered yet", 400));
  }

  const decryptedPass = await bcrypt.compare(password, req.user.password);
  if (req.user.email === email && decryptedPass) {
    const userID = userEmail._id;

    await Contact.deleteMany({ user_id: userID });
    await userEmail.deleteOne({ _id: req.params.id });

    res.status(200).json({
      message: "User and all his contacts have been deleted Successfully",
    });
  } else {
    return next(
      new AppError("You are not authorized to delete this user", 400)
    );
  }
});

////////////////////////////////////////////////////////////////////////

const forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = generateToken();
  const tokenDB = hashToken(resetToken);
  await user.updateOne({
    passwordResetToken: tokenDB,
    // passwordResetExpires: Date.now(),
  });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/users/resetpassword/${resetToken}`;

  const message = `Hey ${user.username}, \n Forgot your password? Don't Worry :) \n Submit a PATCH request with your new password to: ${resetURL} \n If you didn't forget your password, please ignore this email ! `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password token is valid only for 10 mins!",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
      // user,
      token: resetToken,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    // user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      res.json({
        err: err.message,
      })
    );
  }
});

////////////////////////////////////////////////////

const resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on the token
  const token = req.params.token;
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // passwordResetExpires: { $gt: Date.now() },
  });

  // 2) if token not expired and there is a user,
  // set new password

  if (!user) {
    return next(new AppError("Token is invalid", 400));
  }
  const temp = req.body.password;
  const hashedPassword = await bcrypt.hash(temp, 10);
  user.password = hashedPassword;
  user.passwordResetToken = undefined;
  // user.passwordResetExpires = undefined;
  await user.save();

  // 4) log the user in, send jwt

  const accessToken = jwt.sign(
    {
      id: user._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "30d",
    }
  );
  res.status(200).json({ accessToken });
});

////////////////////////////////////////////////////

module.exports = {
  registerUser,
  loginUser,
  currentUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  logOut,
  // uploadUserPhoto,
};
