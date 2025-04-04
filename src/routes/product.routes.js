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

const uploadfile = upload.array("images", 9);
const router = express.Router();

router.get("/", getAllProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:id", getProductById);
router.post("/", uploadfile, createProduct);
router.put("/:id", uploadfile, updateProduct);
router.put("/:id/stock", updateProductStock);
router.delete("/:id", deleteProduct);

export default router;
