import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addToCartValidator,
  removeFromCartValidator,
} from "../validators/cart.validator.js";

const router = express.Router();

router.use(verifyJWT);
router.post("/add", addToCartValidator, addToCart);
router.get("/", getCart);
router.delete("/:cartItemId", removeFromCartValidator, removeFromCart);
router.delete("/", clearCart);

export default router;
