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

    const products = await Product.find({ isAvailable: true })
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

export const getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // want promise and total in such a way that product which has isAvailable value as true will be fetched

  const [products, total] = await Promise.all([
    Product.find({ category: categoryId, isAvailable: true })
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments({ category: categoryId, isAvailable: true }),
  ]);

  if (products.length === 0) {
    throw new ApiError(404, "No products found in this category");
  }

  const totalPages = Math.ceil(total / limit);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { products, currentPage: page, totalPages, totalProducts: total },
        "Products fetched successfully"
      )
    );
});

export const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({ _id: productId, isAvailable: true });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

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

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    brand,
    price,
    countInStock,
    category,
    existingImages,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID.");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  // ✅ Category update only if provided
  if (category !== undefined) {
    let categoryIds = Array.isArray(category) ? category : [category];
    categoryIds = [...new Set(categoryIds)].filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    const validCategories = await Category.find({ _id: { $in: categoryIds } });
    if (validCategories.length !== categoryIds.length) {
      throw new ApiError(400, "Some provided categories are invalid.");
    }

    product.category = categoryIds;
  }

  // ✅ Slug + name check only if name is changed
  if (name && name !== product.name) {
    const slugName = slug(name);
    const existing = await Product.findOne({
      slug: slugName,
      _id: { $ne: id },
    });
    if (existing) {
      throw new ApiError(
        400,
        "Another product with the same name already exists."
      );
    }
    product.name = name;
    product.slug = slugName;
  }

  if (description) product.description = description;
  if (brand) product.brand = brand;
  if (price && !isNaN(price)) product.price = parseFloat(price);
  if (countInStock && !isNaN(countInStock))
    product.countInStock = parseInt(countInStock, 10);

  // ✅ Only perform image logic if something is changing
  if (req.files?.length > 0 || existingImages !== undefined) {
    let updatedImages = Array.isArray(existingImages)
      ? [...new Set(existingImages)]
      : [];

    const imagesToRemove = product.images.filter(
      (img) => !updatedImages.includes(img)
    );

    // ❌ Delete old images from Cloudinary
    for (const imgUrl of imagesToRemove) {
      const publicId = imgUrl.split("/").pop().split(".")[0];
      try {
        await deleteFromCloudinary(`ecommerce/${publicId}`);
      } catch (error) {
        console.error("Error deleting image:", error.message);
      }
    }

    // ⬆️ Upload new images
    if (req.files && req.files.length > 0) {
      if (req.files.length + updatedImages.length > 5) {
        throw new ApiError(400, "Maximum of 5 images allowed.");
      }

      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(
            file.buffer,
            file.originalname
          );
          updatedImages.push(result.secure_url);
        } catch (uploadError) {
          throw new ApiError(500, "Cloudinary upload failed", [
            uploadError.message,
          ]);
        }
      }
    }

    product.images = updatedImages;
  }

  const updatedProduct = await product.save();
  res
    .status(200)
    .json(
      new ApiResponse(200, updatedProduct, "Product updated successfully.")
    );
});

export const updateProductStock = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { countInStock } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  if (countInStock === undefined || isNaN(countInStock) || countInStock < 0) {
    throw new ApiError(400, "Valid stock count is required");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  product.countInStock = parseInt(countInStock, 10);
  const updatedProduct = await product.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedProduct, "Product stock updated successfully")
    );
});

// export const deleteProduct = asyncHandler(async (req, res) => {
//   const { productId } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(productId)) {
//     throw new ApiError(400, "Invalid product ID");
//   }

//   const product = await Product.findById(productId);
//   if (!product) {
//     throw new ApiError(404, "Product not found");
//   }

//   if (Array.isArray(product.images) && product.images.length > 0) {
//     for (const imageUrl of product.images) {
//       const publicId = imageUrl.split("/").pop().split(".")[0];
//       try {
//         await deleteFromCloudinary(`ecommerce/${publicId}`);
//       } catch (error) {
//         console.error("Cloudinary delete error:", error.message);
//       }
//     }
//   }

//   await product.deleteOne();

//   res
//     .status(200)
//     .json(new ApiResponse(200, null, "Product deleted successfully"));
// });

export const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  product.isAvailable = false;

  const updatedProduct = await product.save();

  res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "Product deleted successfully"));
});
