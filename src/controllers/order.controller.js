import Address from "../models/address.model.js";
import CartProduct from "../models/cart.model.js";
import Order from "../models/order.model.js";
import { User } from "../models/user.model.js";
import Product from "../models/product.model.js";
import stripe from "../utils/stripe.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 🎯 Create Payment Intent
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { addressId, paymentMethodId } = req.body;

  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw new ApiError(404, "Address not found");

  const cartItems = await CartProduct.find({ userId }).populate(
    "productId",
    "name price countInStock"
  );

  if (cartItems.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  for (const item of cartItems) {
    if (item.productId.countInStock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${item.productId.name}`);
    }
  }

  let totalAmount = 0;
  cartItems.forEach((item) => {
    totalAmount += item.productId.price * item.quantity;
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100),
    currency: "inr",
    payment_method: paymentMethodId,
    confirm: true,
    return_url: "https://frontend.com/payment-success",
    metadata: {
      userId: userId.toString(),
      addressId: addressId.toString(),
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        totalAmount,
      },
      "Payment Intent created"
    )
  );
});

// 🧾 Create Order After Successful Payment
export const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { paymentIntentId, addressId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== "succeeded") {
    throw new ApiError(400, "Payment not successful");
  }

  const existingOrder = await Order.findOne({ paymentId: paymentIntentId });
  if (existingOrder) {
    throw new ApiError(400, "This payment has already been processed");
  }

  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw new ApiError(404, "Address not found");

  const cartItems = await CartProduct.find({ userId }).populate(
    "productId",
    "name price countInStock"
  );

  if (cartItems.length === 0) throw new ApiError(400, "Cart is empty");

  const products = cartItems.map((item) => ({
    productId: item.productId._id,
    quantity: item.quantity,
    priceAtPurchase: item.productId.price,
  }));

  let totalAmount = 0;
  cartItems.forEach((item) => {
    totalAmount += item.productId.price * item.quantity;
  });

  const orderId = `ORD-${uuidv4().substring(0, 8)}`;

  const newOrder = new Order({
    userId,
    orderId,
    products,
    paymentId: paymentIntentId,
    paymentStatus: "Completed",
    deliveryAddress: addressId,
    totalAmount,
    orderStatus: "Processing",
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const savedOrder = await newOrder.save({ session });

    for (const item of cartItems) {
      await Product.findByIdAndUpdate(
        item.productId._id,
        { $inc: { countInStock: -item.quantity } },
        { session }
      );
    }

    await User.findByIdAndUpdate(
      userId,
      { $push: { orderHistory: savedOrder._id } },
      { session }
    );

    await CartProduct.deleteMany({ userId }, { session });

    await session.commitTransaction();
    session.endSession();

    res
      .status(201)
      .json(new ApiResponse(201, savedOrder, "Order placed successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(500, "Failed to place order", [error.message]);
  }
});
