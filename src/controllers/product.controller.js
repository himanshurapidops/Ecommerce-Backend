import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import { uploadToCloudinary } from "../utils/cloudnary.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import slug from "slug";

export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments();

    res.status(200).json({
      success: true,
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ category: categoryId })
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ category: categoryId });

    res.status(200).json({
      success: true,
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products by category",
      error: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId).populate("category");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, brand, price, countInStock, category } = req.body;

  // Basic validations
  if (!name || !description || isNaN(price) || isNaN(countInStock)) {
    throw new ApiError(400, "Invalid input data.");
  }

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No images uploaded.");
  }

  // Normalize categories
  let categoryIds = Array.isArray(category) ? category : [category];
  categoryIds = categoryIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (categoryIds.length === 0) {
    throw new ApiError(400, "Invalid categories provided.");
  }

  const validCategories = await Category.find({ _id: { $in: categoryIds } });
  if (validCategories.length !== categoryIds.length) {
    throw new ApiError(400, "Some provided categories do not exist.");
  }

  const uploadedImages = [];
  for (const file of req.files) {
    try {
      const result = await uploadToCloudinary(file.buffer, file.originalname);
      uploadedImages.push(result.secure_url);
    } catch (uploadError) {
      throw new ApiError(500, "Error uploading images to Cloudinary", [
        uploadError.message,
      ]);
    }
  }

  if (uploadedImages.length === 0) {
    throw new ApiError(400, "No images uploaded.");
  }

  if (uploadedImages.length > 5) {
    throw new ApiError(400, "Maximum of 5 images allowed.");
  }

  const slugName = slug(name);
  const existingProduct = await Product.findOne({ slug: slugName });
  if (existingProduct) {
    throw new ApiError(400, "Product with the same name already exists.");
  }

  const product = new Product({
    name,
    description,
    brand,
    price: parseFloat(price),
    countInStock: parseInt(countInStock, 10),
    category: categoryIds,
    images: uploadedImages,
    slug: slugName,
  });

  const savedProduct = await product.save();

  res
    .status(201)
    .json(new ApiResponse(201, savedProduct, "Product created successfully."));
});
export const updateProduct = async (req, res) => {
  try {
    const { productId: id } = req.params;
    const { name, description, brand } = req.body;
    const price = parseFloat(req.body.price);
    const countInStock = parseInt(req.body.countInStock, 10);
    let category = req.body.category;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID." });
    }

    if (!name || !description || isNaN(price) || isNaN(countInStock)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid input data." });
    }

    let categoryIds = Array.isArray(category) ? category : [category];
    categoryIds = categoryIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    const validCategories = await Category.find({ _id: { $in: categoryIds } });
    if (validCategories.length !== categoryIds.length) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid categories provided." });
    }

    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const imageUrl = await uploadToCloudinary(file);
          uploadedImages.push(imageUrl);
        } catch (uploadError) {
          return res.status(500).json({
            success: false,
            message: "Error uploading images",
            error: uploadError.message,
          });
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        category: categoryIds,
        brand,
        price,
        countInStock,
        ...(uploadedImages.length > 0 && { images: uploadedImages }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

export const updateProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { countInStock } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (countInStock === undefined || countInStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid stock count is required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.countInStock = countInStock;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product stock updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating product stock",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        const publicId = imageUrl.split("/").slice(-1)[0].split(".")[0];
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(`products/${publicId}`);
          } catch (error) {
            console.error(
              `Error removing image from Cloudinary: ${error.message}`
            );
          }
        }
      }
    }

    await Product.findByIdAndDelete(productId);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};
