import { model, Schema } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Provide product name!"],
    },
    description: {
      type: String,
      required: [true, "Provide product description!"],
    },
    images: [
      {
        type: String,
        required: [true, "Provide product images!"],
      },
    ],
    brand: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      required: [true, "Provide product slug!"],
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
  },
  { timestamps: true }
);

const Product = model("Product", productSchema);
export default Product;
