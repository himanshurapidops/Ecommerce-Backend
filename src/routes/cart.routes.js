import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

router.post("/add", addToCart);
router.get("/", getCart);
router.delete("/:cartItemId", removeFromCart);
router.delete("/", clearCart);

export default router;
