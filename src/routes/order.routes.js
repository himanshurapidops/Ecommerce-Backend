import express from "express";
import {
  createPaymentIntent,
  createOrder,
} from "../controllers/order.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPaymentIntentValidator,
  createOrderValidator,
} from "../validators/order.validator.js";

const router = express.Router();

router.use(verifyJWT);

router.post(
  "/payment-intent",
  createPaymentIntentValidator,
  createPaymentIntent
);
router.post("/", createOrderValidator, createOrder);

export default router;
