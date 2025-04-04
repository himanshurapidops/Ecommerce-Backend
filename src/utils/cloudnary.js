import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import { ApiError } from "./ApiError.js";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "ecommerce",
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      resource_type: "image",
      public_id: `${Date.now()}-${file.originalname}`,
      tags: "ecommerce",
      quality: "auto",
      fetch_format: "auto",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      transformation: [
        { width: 300, height: 300, crop: "scale" },
        { width: 1000, height: 1000, crop: "scale" },
        { width: 2000, height: 2000, crop: "scale" },
      ],
    });

    fs.unlinkSync(file.path, (err) => {
      if (err) console.error("Error deleting file ${file.path}:", err);
    });

    return result.secure_url;
  } catch (error) {
    throw new ApiError("Error uploading to Cloudinary: ${error.message}");
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    throw new ApiError("Error deleting from Cloudinary: ${error.message}");
  }
};
