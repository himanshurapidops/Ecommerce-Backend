import { body, param } from "express-validator";

export const createCategoryValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ max: 100 })
    .withMessage("Category name must be less than 100 characters"),
];

export const updateCategoryValidator = [
  param("slug").trim().notEmpty().withMessage("Slug parameter is required"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ max: 100 })
    .withMessage("Category name must be less than 100 characters"),
];

export const deleteCategoryValidator = [
  param("slug").trim().notEmpty().withMessage("Slug parameter is required"),
];
