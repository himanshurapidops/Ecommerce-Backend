import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const isAdmin = asyncHandler(async (req, res, next) => {
  const adminVerify = req.user.role.includes("ADMIN");

  if (!adminVerify) {
    throw new ApiError(401, "this routes only belongs to admin");
  }

  next();
});
