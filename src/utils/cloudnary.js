import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import streamifier from "streamifier";
import { ApiError } from "./ApiError.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ecommerce",
        use_filename: true,
        unique_filename: true,
        overwrite: true,
        resource_type: "image",
        public_id: `${Date.now()}-${originalName}`,
        tags: "ecommerce",
        quality: "auto",
        fetch_format: "auto",
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
        transformation: [
          { width: 300, height: 300, crop: "scale" },
          { width: 1000, height: 1000, crop: "scale" },
          { width: 2000, height: 2000, crop: "scale" },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(
            new ApiError(500, `Cloudinary Upload Error: ${error.message}`)
          );
        }
        if (!result?.secure_url) {
          return reject(
            new ApiError(500, "Cloudinary did not return a secure_url.")
          );
        }
        return resolve(result); // return full result
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    throw new ApiError(500, `Cloudinary Deletion Error: ${error.message}`);
  }
};
