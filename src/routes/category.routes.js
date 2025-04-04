import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = express.Router();

router.post("/", createCategory);
router.get("/", getCategories);
router.put("/:slug", updateCategory);
router.delete("/:slug", deleteCategory);

export default router;
