const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/", protect, admin, userController.getUsers);
router.get("/:id", protect, admin, userController.getUserById);
router.put("/profile", protect, userController.updateUserProfile);
router.put("/:id", protect, admin, userController.updateUser);
router.delete("/:id", protect, admin, userController.deleteUser);

module.exports = router;
