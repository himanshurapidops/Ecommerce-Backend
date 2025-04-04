import express from "express";
import {
  createPaymentIntent,
  createOrder,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/payment-intent", createPaymentIntent);

router.post("/", createOrder);

export default router;
