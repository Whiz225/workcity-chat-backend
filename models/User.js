// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your fullName!"],
      trim: true,
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Please provide your valid email"],
      unique: [true, "Email is already in use by another user"],
    },
    password: {
      type: "string",
      required: [true, "Please put your password"],
      minlength: [8, "password should not be less down 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "agent", "customer", "designer", "merchant"],
      default: "customer",
    },
    avatar: String,
    // passwordConfirm: {
    //   type: String,
    //   validate: {
    //     validator: function (val) {
    //       return val === this.password;
    //     },
    //     message: "Passwords are not same!",
    //   },
    // },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date },
    // passwordChangedAt: Date,
    // passwordResetToken: "string",
    // passwordResetExpires: Date,
    // createdAt: {
    //   type: Date,
    //   default: Date.now,
    //   select: false,
    // },
    // updatedAt: {
    //   type: Date,
    //   default: Date.now,
    // },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.correctPassword = async (
  candidatePassword,
  userPassword
) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
//   if (this.passwordChangedAt) {
//     const passwordChangedTime = parseInt(
//       Date.now(this.passwordChangedAt / 1000),
//       10
//     );
//     return passwordChangedTime < JWTTimestamp;
//   }

//   return false;
// };

// userSchema.methods.createPasswordResetToken = function () {
//   const resetToken = crypto.randomBytes(32).toString("hex");
//   this.passwordResetToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");
//   this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

//   return resetToken;
// };

const User = mongoose.model("User", userSchema);
module.exports = User;
