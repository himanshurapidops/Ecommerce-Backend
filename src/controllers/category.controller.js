import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import slug from "slug";

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const existingCategory = await Category.findOne({
    $or: [{ name }, { slug: slug(name) }],
  });

  if (existingCategory) {
    throw new ApiError(400, "Category already exists");
  }

  const category = await Category.create({
    name,
    slug: slug(name),
  });

  if (!category) {
    throw new ApiError(500, "Failed to create category");
  }

  res.json(new ApiResponse(201, category, "Category created successfully"));
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find();

  if (!categories) {
    throw new ApiError(404, "Categories not found");
  }

  res.json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { slug: categorySlug } = req.params;
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const updatedCategory = await Category.findOneAndUpdate(
    { slug: categorySlug },
    {
      name,
      slug: slug(name),
    },
    { new: true, runValidators: true }
  );

  if (!updatedCategory) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedCategory, "Category updated successfully")
    );
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await Category.findOne({ slug });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const productsCount = await Product.countDocuments({
    category: category._id,
  });

  if (productsCount > 0) {
    await Product.updateMany(
      { category: category._id },
      { $pull: { category: category._id } }
    );
  }

  await Category.deleteOne({ _id: category._id });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Category deleted successfully"));
});
