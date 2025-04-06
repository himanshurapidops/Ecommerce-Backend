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
import {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateAccountValidator,
} from "../validators/user.validators.js";
const router = Router();

// auth routes
router.route("/login").post(loginValidator, loginUser);
router.route("/register").post(registerValidator, registerUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/verify-email/:token").get(verifyEmailValidator, verifyEmail);
router.route("/forget-password").post(forgotPasswordValidator, forgotPassword);
router
  .route("/reset-password/:token")
  .post(resetPasswordValidator, resetPassword);

//secure route
router.use(verifyJWT);
router.route("/logout").post(logoutUser);
router.route("/change-password").post(changePasswordValidator, changePassword);
router.route("/current-user").get(getCurrentUser);
router
  .route("/update-account")
  .put(updateAccountValidator, updateAccountDetails);

export default router;
