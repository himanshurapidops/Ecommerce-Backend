import express from "express";
import {
  getAllProducts,
  getProductsByCategory,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
} from "../controllers/product.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middlware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  validateProductCreation,
  validateProductUpdate,
  validateProductId,
  validatePagination,
  validateCategoryId,
} from "../validators/product.validator.js";
const uploadfile = upload.array("images", 9);
const router = express.Router();

router.get("/", validatePagination, getAllProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:productId", validateProductId, getProductById);

//secure route
router.use(verifyJWT);
router.use(isAdmin);
router.post("/", validateProductCreation, uploadfile, createProduct);
router.put("/:productId", validateProductUpdate, uploadfile, updateProduct);
router.put("/:productId/stock", validateCategoryId, updateProductStock);
router.delete("/:productId", validateProductId, deleteProduct);

export default router;
