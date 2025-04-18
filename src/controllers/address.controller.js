import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Address from "../models/address.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createAddress = asyncHandler(async (req, res) => {
  const { addressLine1, city, state, pincode, country, mobile } = req.body;
  const userId = req.user._id;

  if (!addressLine1 || !city || !state || !pincode || !country || !mobile) {
    throw new ApiError(400, "All fields are required");
  }

  const address = await Address.create({
    addressLine1,
    city,
    state,
    pincode,
    country,
    mobile,
    userId,
  });

  if (!address) {
    throw new ApiError(500, "Failed to create address");
  }

  const result = await Address.findById(address._id).select(
    "addressLine1 city state pincode country mobile"
  );

  res.json(new ApiResponse(201, result, "Address created successfully"));
});

export const getUserAddresses = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const addresses = await Address.find({ userId }).select(
    "addressLine1 city state pincode country mobile"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        addresses,
        addresses.length > 0
          ? "Addresses retrieved successfully"
          : "No addresses found"
      )
    );
});

export const getAddressById = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const userId = req.user._id;

  const address = await Address.findOne({ _id: addressId, userId }).select(
    "addressLine1 city state pincode country mobile"
  );

  if (!address) {
    throw new ApiError(404, "Address not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, address, "Address retrieved successfully"));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { addressLine1, city, state, pincode, country, mobile } = req.body;
  const id = req.params.addressId;

  if (!addressLine1 || !city || !state || !pincode || !country || !mobile) {
    throw new ApiError(400, "All fields are required");
  }
  const address = await Address.findOneAndUpdate(
    { _id: id, userId },
    {
      addressLine1,
      city,
      state,
      pincode,
      country,
      mobile,
    },
    { new: true },
    { runValidators: true },
    { select: "addressLine1 city state pincode country mobile" }
  );

  if (!address) {
    throw new ApiError(404, "Address not found or unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, address, "Address updated successfully"));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const id = req.params.addressId;
  const userId = req.user._id;

  if (!id) {
    throw new ApiError(400, "Address ID is required");
  }

  const address = await Address.findOneAndDelete({ _id: id, userId });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  res.json(new ApiResponse(200, "Address deleted successfully"));
});
