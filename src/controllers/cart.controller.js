import { sendEmail } from "../email/email.js";
import CartProduct from "../models/cart.model.js";
import Product from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user._id;

  const product = await Product.findOne({ _id: productId, isAvailable: true });

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  if (product.countInStock < quantity) {
    await sendEmail({
      to: process.env.EMAIL_FROM,
      from: process.env.ADMIN_EMAIL,
      subject: "Stock Alert",
      html: `<p>Product ${product.name} is running low on stock. Customer wants ${quantity} units of ${product.name} and we have only ${product.countInStock} units left</p>`,
    });

    throw new ApiError(400, "Insufficient stock");
  }

  const existingCartItem = await CartProduct.findOne({ userId, productId });

  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + parseInt(quantity);

    if (product.countInStock < newQuantity) {
      throw new ApiError(400, "Insufficient stock");
    }

    existingCartItem.quantity = newQuantity;
    await existingCartItem.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, existingCartItem, "Cart updated successfully")
      );
  }

  const cartItem = new CartProduct({
    userId,
    productId,
    quantity: parseInt(quantity),
  });

  const savedCartItem = await cartItem.save();

  res
    .status(201)
    .json(new ApiResponse(201, savedCartItem, "Product added to cart"));
});

export const getCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const cartItems = await CartProduct.find({ userId }).populate(
    "productId",
    "name price images countInStock"
  );

  let totalAmount = 0;
  cartItems.forEach((item) => {
    totalAmount += item.productId.price * item.quantity;
  });

  res
    .status(200)
    .json(new ApiResponse(200, { cartItems, totalAmount }, "Cart fetched"));
});

export const removeFromCart = asyncHandler(async (req, res, next) => {
  const { cartItemId } = req.params;
  const userId = req.user._id;

  const cartItem = await CartProduct.findOne({ _id: cartItemId, userId });
  if (!cartItem) {
    throw new ApiError(404, "Cart item not found.");
  }

  await CartProduct.findByIdAndDelete(cartItemId);

  res.status(200).json(new ApiResponse(200, null, "Item removed from cart"));
});

export const clearCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  await CartProduct.deleteMany({ userId });

  res.status(200).json(new ApiResponse(200, null, "Cart cleared successfully"));
});
