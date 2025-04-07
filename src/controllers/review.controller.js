import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Product from "../models/product.model.js";
import Review from "../models/review.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

export const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "Invalid user Id");

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  const existingReview = await Review.findOne({
    product: productId,
    user: userId,
  });

  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this product");
  }

  const review = await Review.create({
    product: productId,
    user: userId,
    rating,
    comment,
  });

  const reviews = await Review.find({ product: productId }).select(
    "rating comment user product _id"
  );

  const numReviews = reviews.length;
  const avgRating =
    reviews.reduce((acc, item) => acc + item.rating, 0) / numReviews;

  product.numReviews = numReviews;
  product.rating = avgRating;
  await product.save();

  res.status(201).json(new ApiResponse(201, review, "Review created"));
});

export const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  const review = await Review.findOne({ _id: reviewId, user: userId });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  review.rating = rating;
  review.comment = comment;

  await review.save();

  const reviews = await Review.find({ product: review.product });

  const numReviews = reviews.length;
  const avgRating =
    reviews.reduce((acc, item) => acc + item.rating, 0) / numReviews;

  const product = await Product.findById(review.product);
  product.rating = avgRating;
  await product.save();

  res.status(200).json(new ApiResponse(200, review, "Review updated"));
});

export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  if (!reviewId) {
    throw new ApiError(400, "Review ID is required");
  }

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const review = await Review.findOneAndDelete({ _id: reviewId, user: userId });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  res.status(200).json(new ApiResponse(200, review, "Review deleted"));
});

export const getReviewsByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const reviews = await Review.find({ product: productId }).populate(
    "user",
    "name"
  );

  res.status(200).json(new ApiResponse(200, reviews, "Reviews fetched"));
});

export const getReviewsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const reviews = await Review.find({ user: userId }).populate(
    "product",
    "name"
  );

  res.status(200).json(new ApiResponse(200, reviews, "Reviews fetched"));
});

export const getReviewById = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const review = await Review.findOne({ _id: reviewId }).populate(
    "product",
    "name"
  );

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  res.status(200).json(new ApiResponse(200, review, "Review fetched"));
});
