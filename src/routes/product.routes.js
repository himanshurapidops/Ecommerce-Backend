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

// import {
//   createProductValidator,
//   updateProductValidator,
//   updateProductStockValidator,
//   deleteProductValidator,
// } from "../validators/product.validator.js";

const uploadfile = upload.array("images", 9);
const router = express.Router();

router.get("/", getAllProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:productId", getProductById);

//secure route
router.use(verifyJWT);
router.use(isAdmin);
router.post("/", uploadfile, createProduct);
router.put("/:productId", uploadfile, updateProduct);
router.put("/:productId/stock", updateProductStock);
router.delete("/:productId", deleteProduct);

export default router;
