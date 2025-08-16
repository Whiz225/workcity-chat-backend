// controllers/authController.js
const crypto = require("crypto");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: `${process.env.JWT_EXPIRES_IN + 1 * 10 * 1000}`,
  });
};

const creatSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
    domain:
      process.env.NODE_ENV === "production" ? ".yourdomain.com" : undefined,
  };

  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { email, name, password, role } = req.body;

  if (!email || !name || !password) {
    return next(new AppError("Please add all required fields", 400));
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const newUser = await User.create({
    name,
    password,
    email,
    role: role || "customer",
  });

  if (!newUser) {
    return next(new AppError("Something went wrong while creating user", 404));
  }

  if (newUser) creatSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError("Please provide your email and password"), 400);

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("Incorrect email or password", 404));

  creatSendToken(user, 200, res);
});

exports.logOutUser = catchAsync(async (req, res, next) => {
  res.cookie("jwt", "Logged out", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
  });
});

exports.getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.status(200).json({
    success: "success",
    data: user,
  });
});
