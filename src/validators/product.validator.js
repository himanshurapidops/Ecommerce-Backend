import { body, param, query } from "express-validator";
import mongoose from "mongoose";

export const validateProductId = [
  param("productId").custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error("Invalid product ID");
    }
    return true;
  }),
];

export const validateProductCreation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("brand").trim().notEmpty().withMessage("Brand is required"),
  body("price")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number"),
  body("countInStock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("category").custom((value) => {
    const ids = Array.isArray(value) ? value : [value];
    if (!ids.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      throw new Error("One or more category IDs are invalid");
    }
    return true;
  }),
];

export const validateProductUpdate = [
  param("id").custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error("Invalid product ID");
    }
    return true;
  }),
  body("price")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number"),
  body("countInStock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("category")
    .optional()
    .custom((value) => {
      const ids = Array.isArray(value) ? value : [value];
      if (!ids.every((id) => mongoose.Types.ObjectId.isValid(id))) {
        throw new Error("One or more category IDs are invalid");
      }
      return true;
    }),
];

export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be at least 1"),
  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Limit must be at least 1"),
];

export const validateCategoryId = [
  param("categoryId").custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error("Invalid category ID");
    }
    return true;
  }),
];
