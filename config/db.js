// config/db.js
const mongoose = require("mongoose");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

const connectDB = async () => {
  try {
    await mongoose.connect(DB);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("DB connection error", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
