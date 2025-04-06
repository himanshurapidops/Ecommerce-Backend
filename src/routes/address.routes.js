import Router from "express";
import {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.post("/", createAddress);
router.get("/", getUserAddresses);
router.get("/:addressId", getAddressById);
router.put("/:addressId", updateAddress);
router.delete("/:addressId", deleteAddress);

export default router;
