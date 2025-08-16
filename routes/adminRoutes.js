const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const { getStat, getRecentUser } = require("../controllers/adminController");

// Admin dashboard stats
router.get("/stats", protect, admin, getStat);

// Get recent users
router.get("/users/recent", protect, admin, getRecentUser);

module.exports = router;
