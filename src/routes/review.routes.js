import express from "express";
import {
  createReview,
  updateReview,
  deleteReview,
  getReviewsByProduct,
  getReviewsByUser,
  getReviewById,
} from "../controllers/review.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
  getReviewByIdValidator,
  getReviewsByProductValidator,
  getReviewsByUserValidator,
} from "../validators/review.validator.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createReviewValidator, createReview);
router.put("/:reviewId", updateReviewValidator, updateReview);
router.delete("/:reviewId", deleteReviewValidator, deleteReview);
router.get(
  "/product/:productId",
  getReviewsByProductValidator,
  getReviewsByProduct
);
router.get("/user/:userId", getReviewsByUserValidator, getReviewsByUser);
router.get("/:reviewId", getReviewByIdValidator, getReviewById);

export default router;
