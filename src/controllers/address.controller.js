import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Address } from "../models/address.model";
import { ApiResponse } from "../utils/ApiResponse";

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

  address.save();

  res.json(new ApiResponse(201, "Address created successfully"));
});
export const getUserAddresses = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const address = await Address.find({ userId });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  res.json(new ApiResponse(200, address));
});

export const getAddressById = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const address = await Address.find({ userId });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  res.json(new ApiResponse(200, address));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { addressLine1, city, state, pincode, country, mobile } = req.body;
  const addressId = req.params.id;
  const userId = req.user._id;

  if (!addressLine1 || !city || !state || !pincode || !country || !mobile) {
    throw new ApiError(400, "All fields are required");
  }

  const address = await Address.findOneAndUpdate(
    { _id: addressId },
    {
      $set: {
        addressLine1,
        city,
        state,
        pincode,
        country,
        mobile,
      },
    },
    { new: true }
  );

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  res.json(new ApiResponse(200, "Address updated successfully"));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const addressId = req.params.id;

  const address = await Address.findOneAndDelete({ _id: addressId });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  res.json(new ApiResponse(200, "Address deleted successfully"));
});
