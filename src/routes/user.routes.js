import { Router } from "express";
import {
  registerUser,
  logoutUser,
  loginUser,
  refreshAccessToken,
  forgotPassword,
  updateAccountDetails,

} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();


router.route("/login").post(loginUser);

//secure route
router.route("/register").post(registerUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresuh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, forgotPassword);
// router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT,  );
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails);

export default router;