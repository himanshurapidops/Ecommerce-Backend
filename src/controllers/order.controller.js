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
import { sendEmail } from "../email/email.js"; // ensure this is imported if used

export const createPaymentIntent = asyncHandler(async (req, res) => {
  // const userId = "67efb3efdbe41b3e5d5f2e66";
  const userId = req.user._id;
  const { addressId } = req.body;

  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw new ApiError(404, "Address not found");

  const cartItems = await CartProduct.find({ userId }).populate(
    "productId",
    "name price countInStock"
  );
  if (!cartItems.length) throw new ApiError(400, "Cart is empty");

  let totalAmount = 0;
  for (const item of cartItems) {
    if (item.productId.countInStock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${item.productId.name}`);
    }
    totalAmount += item.productId.price * item.quantity;
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: "inr",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      payment_method: "pm_card_visa",
      confirm: true,
      metadata: {
        userId: userId.toString(),
        addressId: addressId.toString(),
      },
    });
  } catch (err) {
    throw new ApiError(500, "Stripe payment creation failed", [err.message]);
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        totalAmount,
      },
      "Payment Intent created"
    )
  );
});

export const createOrder = asyncHandler(async (req, res) => {
  // const userId = "67efb3efdbe41b3e5d5f2e66";
  const { paymentIntentId, addressId } = req.body;
  const userId = req.user._id;

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
  if (!cartItems.length) throw new ApiError(400, "Cart is empty");

  let paymentIntent;
  try {
    console.log(paymentIntentId);
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    throw new ApiError(500, "Stripe payment verification failed", [
      err.message,
    ]);
  }

  if (paymentIntent.status !== "succeeded") {
    if (
      paymentIntent.status === "requires_confirmation" ||
      paymentIntent.status === "requires_action" ||
      paymentIntent.status === "requires_payment_method"
    ) {
      try {
        paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method: "pm_card_visa",
        });
      } catch (err) {
        throw new ApiError(400, "Stripe confirmation failed", [err.message]);
      }
    } else {
      throw new ApiError(400, "Payment cannot be confirmed in current state");
    }
  }

  let totalAmount = 0;
  const products = cartItems.map((item) => {
    totalAmount += item.productId.price * item.quantity;
    return {
      productId: item.productId._id,
      quantity: item.quantity,
      priceAtPurchase: item.productId.price,
    };
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

    try {
      const productList = cartItems
        .map(
          (item) =>
            `• ${item.productId.name} x${item.quantity} - ₹${
              item.productId.price * item.quantity
            }`
        )
        .join("\n");

      await sendEmail({
        to: req.user?.email || "test@example.com",
        from: process.env.ADMIN_EMAIL,
        subject: "🧾 Order Confirmation",
        text: `Thank you for your order!\n\nOrder ID: ${orderId}\n\n${productList}\n\nTotal Paid: ₹${totalAmount}\n\nYour order is being processed.`,
      });
    } catch (emailErr) {
      console.warn("Email sending failed:", emailErr.message);
    }

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
