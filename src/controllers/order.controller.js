import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { Order } from "../models/order.model";

export const createOrder = asyncHandler(async (req, res) => {
    const { userId, orderId, products } = req.body;
    const order = await Order.create({ userId, orderId, products });
    order.save();
    res.json(new ApiResponse(201, "Order created successfully"));
});

export const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find();
    res.json(new ApiResponse(200, orders));
});

export const getOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }
    res.json(new ApiResponse(200, order));   
});

export const updateOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });
    res.json(new ApiResponse(200, updatedOrder));
});