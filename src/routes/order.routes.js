import express from "express";
import {
  createPaymentIntent,
  createOrder,
} from "../controllers/order.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/payment-intent", createPaymentIntent);
router.post("/", createOrder);

export default router;
