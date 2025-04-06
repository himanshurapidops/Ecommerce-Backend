import Router from "express";
import {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createAddressValidator,
  updateAddressValidator,
  deleteAddressValidator,
  getAddressByIdValidator,
} from "../validators/address.validator.js";

const router = Router();

router.use(verifyJWT);
router.post("/", createAddressValidator, createAddress);
router.get("/", getUserAddresses);
router.get("/:addressId", getAddressByIdValidator, getAddressById);
router.put("/:addressId", updateAddressValidator, updateAddress);
router.delete("/:addressId", deleteAddressValidator, deleteAddress);

export default router;
