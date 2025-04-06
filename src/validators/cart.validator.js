import { check, param } from "express-validator";
import mongoose from "mongoose";

const isValidMongoId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format");
  }
  return true;
};

export const addToCartValidator = [
  check("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .custom(isValidMongoId),
  check("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be a number greater than 0"),
];

export const removeFromCartValidator = [
  param("cartItemId")
    .notEmpty()
    .withMessage("Cart Item ID is required")
    .custom(isValidMongoId),
];
