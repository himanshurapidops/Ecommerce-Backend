import { check, param } from "express-validator";
import mongoose from "mongoose";

const isValidMongoId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format");
  }
  return true;
};

export const createAddressValidator = [
  check("addressLine1").notEmpty().withMessage("Address Line 1 is required"),
  check("city").notEmpty().withMessage("City is required"),
  check("state").notEmpty().withMessage("State is required"),
  check("pincode")
    .notEmpty()
    .withMessage("Pincode is required")
    .isPostalCode("IN")
    .withMessage("Invalid pincode"),
  check("country").notEmpty().withMessage("Country is required"),
  check("mobile")
    .notEmpty()
    .withMessage("Mobile number is required")
    .isMobilePhone("en-IN")
    .withMessage("Invalid mobile number"),
];

export const updateAddressValidator = [
  param("id").custom(isValidMongoId),
  check("addressLine1").notEmpty().withMessage("Address Line 1 is required"),
  check("city").notEmpty().withMessage("City is required"),
  check("state").notEmpty().withMessage("State is required"),
  check("pincode")
    .notEmpty()
    .withMessage("Pincode is required")
    .isPostalCode("IN")
    .withMessage("Invalid pincode"),
  check("country").notEmpty().withMessage("Country is required"),
  check("mobile")
    .notEmpty()
    .withMessage("Mobile number is required")
    .isMobilePhone("en-IN")
    .withMessage("Invalid mobile number"),
];

export const getAddressByIdValidator = [param("id").custom(isValidMongoId)];

export const deleteAddressValidator = [param("id").custom(isValidMongoId)];
