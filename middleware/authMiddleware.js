// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/User");
const AppError = require("../utils/AppError");

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt || req.params?.token) {
    token = req.cookies?.jwt || req.params?.token;
  }

  if (!token)
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user)
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        404
      )
    );

  if (req.params?.token) {
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  }

  res.locals.user = user;
  req.user = user;

  next();
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Insufficient privileges." });
    }
    next();
  };
};

exports.admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin");
  }
};
