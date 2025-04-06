import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middlware.js";

const router = express.Router();

router.get("/", getCategories);

router.use(verifyJWT);
router.use(isAdmin);
router.post("/", createCategory);
router.put("/:slug", updateCategory);
router.delete("/:slug", deleteCategory);

export default router;
