import { body, param } from "express-validator";
import mongoose from "mongoose";

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) || "Invalid ObjectId";

export const createReviewValidator = [
  body("productId")
    .notEmpty().withMessage("Product ID is required")
    .custom(isValidObjectId),
  body("rating")
    .notEmpty().withMessage("Rating is required")
    .isFloat({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isString().withMessage("Comment must be a string"),
];

export const updateReviewValidator = [
  param("reviewId")
    .custom(isValidObjectId),
  body("rating")
    .optional()
    .isFloat({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isString().withMessage("Comment must be a string"),
];

export const deleteReviewValidator = [
  param("reviewId")
    .custom(isValidObjectId),
];

export const getReviewByIdValidator = [
  param("reviewId")
    .custom(isValidObjectId),
];

export const getReviewsByProductValidator = [
  param("productId")
    .custom(isValidObjectId),
];

export const getReviewsByUserValidator = [
  param("userId")
    .custom(isValidObjectId),
];
