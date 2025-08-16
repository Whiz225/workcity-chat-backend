const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

exports.getUsers = catchAsync(async (req, res) => {
  const users = await User.find({}).select("-password");
  res.status(200).json({ status: "success", data: users });
});

exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");

  if (user) {
    res.json(user);
  } else {
    next(new AppError("User not found", 404));
  }
});

exports.updateUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    const updatedUser = await user.save();

    res.status(203).json({
      status: "success",
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } else {
    next(new AppError("User not found", 404));
  }
});

exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.remove();
    res.json({ message: "User removed" });
  } else {
    next(new AppError("User not found", 404));
  }
});

exports.updateUserProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.name = req.body.name || user.name;

  if (req.files?.avatar) {
    // Delete old avatar if exists
    if (user.avatar) {
      const oldAvatarPath = path.join(
        __dirname,
        "../uploads",
        user.avatar.split("/").pop()
      );
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    const file = req.files.avatar;
    const fileName = `${Date.now()}-${file.name}`;
    const uploadPath = path.join(__dirname, "../uploads", fileName);

    await file.mv(uploadPath);
    user.avatar = `/uploads/${fileName}`;
  }

  if (req.body.notificationPreferences) {
    user.notificationPreferences = JSON.parse(req.body.notificationPreferences);
  }

  await user.save();

  res.status(203).json({
    status: "success",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      notificationPreferences: user.notificationPreferences,
    },
  });
});
