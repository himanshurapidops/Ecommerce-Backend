import { body, param } from "express-validator";

export const registerValidator = [
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("mobile")
    .notEmpty()
    .withMessage("Mobile is required")
    .isMobilePhone()
    .withMessage("Valid mobile number is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const loginValidator = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Valid email is required if provided"),
  body("mobile")
    .optional()
    .isMobilePhone()
    .withMessage("Valid mobile number is required if provided"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const verifyEmailValidator = [
  param("token").notEmpty().withMessage("Verification token is required"),
];

export const forgotPasswordValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
];

export const resetPasswordValidator = [
  param("token").notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
];

export const changePasswordValidator = [
  body("oldPassword").notEmpty().withMessage("Old password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("New password and confirm password do not match"),
];

export const updateAccountValidator = [
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("mobile")
    .notEmpty()
    .isMobilePhone()
    .withMessage("Valid mobile number is required"),
];
