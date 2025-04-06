import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} from "../validators/category.validator.js";

const router = express.Router();

router.get("/", getCategories);

router.use(verifyJWT);
router.post("/", createCategoryValidator, createCategory);
router.put("/:slug", updateCategoryValidator, updateCategory);
router.delete("/:slug", deleteCategoryValidator, deleteCategory);

export default router;
