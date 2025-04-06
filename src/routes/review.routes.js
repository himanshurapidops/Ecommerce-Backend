import express from "express";
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
const router = express.Router();

router.get("/", getReviews);
router.post("/", createReview);
router.put("/:reviewId", updateReview);
router.delete("/:reviewId", deleteReview);

export default router;
