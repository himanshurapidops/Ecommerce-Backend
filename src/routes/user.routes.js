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
router.route("/forget-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);

//secure route
router.use(verifyJWT);
router.route("/logout").post(logoutUser);
router.route("/change-password").post(changePassword);
router.route("/current-user").get(getCurrentUser);
router.route("/update-account").put(updateAccountDetails);

export default router;
