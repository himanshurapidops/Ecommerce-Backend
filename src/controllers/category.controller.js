import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { Category } from "../models/category.model";
import { Product } from "../models/product.model";
import slug from "slug";

export const createCategory = asyncHandler(async (req, res) => {

    const { name } = req.body;

    if (!name) {
        throw new ApiError(400, "Category name is required");
    }

    const category = await Category.create({
        name,
        slug: slug(name),
    });

    category.save();

    res.json(new ApiResponse(201, "Category created successfully"));
});

export const getCategories = asyncHandler(async (req, res) => {

    const categories = await Category.find();
   
    if(!categories){    
        throw new ApiError(404, "Categories not found");
    }

    res.json(new ApiResponse(200, categories));
});

export const updateCategory = asyncHandler(async (req, res) => {
   
    const {slug} = req.params;
    const {name} = req.body;

    const category = await Category.findOne({slug});

    if(!category){
        throw new ApiError(404, "Category not found");
    }

    category.name = name;
    category.slug = slug(name);
    await category.save();

    res.json(new ApiResponse(200, "Category updated successfully"));
    
});
  
export const deleteCategory = asyncHandler(async (req, res) => {
    
  const { slug } = req.params;
  
  const category = await Category.findOne({ slug });
  
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  
  const products = await Product.find({ category: category._id });
  
  if (products.length > 0) {
    throw new ApiError(400, "Cannot delete category with products");
  }
  
  await Product.updateMany(
    { categories: category._id }, 
    { $pull: { categories: category._id } }
  );
  
  await Category.findByIdAndDelete(category._id);
  
  res.json(new ApiResponse(200, "Category deleted successfully"));
});