import { body } from "express-validator";

export const createPaymentIntentValidator = [
  body("addressId")
    .notEmpty()
    .withMessage("Address ID is required")
    .isMongoId()
    .withMessage("Invalid Address ID"),
];

export const createOrderValidator = [
  body("paymentIntentId")
    .notEmpty()
    .withMessage("Payment Intent ID is required")
    .isString()
    .withMessage("Invalid Payment Intent ID"),
  body("addressId")
    .notEmpty()
    .withMessage("Address ID is required")
    .isMongoId()
    .withMessage("Invalid Address ID"),
];
