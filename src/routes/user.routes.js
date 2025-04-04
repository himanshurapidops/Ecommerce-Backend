import { Router } from "express";
import {
  registerUser,
  logoutUser,
  loginUser,
  refreshAccessToken,
  forgotPassword,
  updateAccountDetails,
  getCurrentUser,
  verifyEmail,
  resetPassword,
  changePassword,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

// auth routes
router.route("/login").post(loginUser);
router.route("/register").post(registerUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/verify-email/:token").get(verifyEmail);

//secure route
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/forget-password").post(verifyJWT, forgotPassword);
router.route("/reset-password/:token").post(resetPassword);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").put(verifyJWT, updateAccountDetails);

export default router;
