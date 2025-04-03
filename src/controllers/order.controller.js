import Address from "../models/address.model.js";
import CartProduct from "../models/cart.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import stripe from "../utils/stripe.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { addressId, paymentMethodId } = req.body;

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) return res.status(404).json({ message: "Address not found" });

    const cartItems = await CartProduct.find({ userId }).populate(
      "productId",
      "name price countInStock"
    );
    if (cartItems.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    for (const item of cartItems) {
      if (item.productId.countInStock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product: ${item.productId.name}`,
          product: item.productId,
        });
      }
    }

    let totalAmount = 0;
    cartItems.forEach((item) => {
      totalAmount += item.productId.price * item.quantity;
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: "inr",
      payment_method: paymentMethodId,
      confirm: true,
      return_url: "https://frontend.com/payment-success",
      metadata: {
        userId: userId.toString(),
        addressId: addressId.toString(),
      },
    });
    res.status(200).json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      totalAmount,
    });
  } catch (error) {
    console.error("Payment Intent Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentIntentId, addressId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    const existingOrder = await Order.findOne({ paymentId: paymentIntentId });
    if (existingOrder) {
      return res
        .status(400)
        .json({ message: "This payment has already been processed" });
    }

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) return res.status(404).json({ message: "Address not found" });

    const cartItems = await CartProduct.find({ userId }).populate(
      "productId",
      "name price countInStock"
    );
    if (cartItems.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

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

      res.status(201).json({
        message: "Order placed successfully",
        order: savedOrder,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: error.message });
  }
};
