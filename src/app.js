import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import morgan from "morgan";
import "./service/cron.js";
import morganMiddleware from "./middlewares/logger.middleware.js";

const app = express();

app.use(morganMiddleware);

app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(morgan("dev"));
app.use(express.static("public"));

//routes import

import userRouter from "./routes/user.routes.js";
import addressRouter from "./routes/address.routes.js";
import productRouter from "./routes/product.routes.js";
import orderRouter from "./routes/order.routes.js";
// import reviewRouter from "./routes/review.routes.js";
import cartRouter from "./routes/cart.routes.js";
import CategoryRouter from "./routes/category.routes.js";
import { ApiResponse } from "./utils/ApiResponse.js";

//routes declaration

app.use("/api/v1/user", userRouter);

app.use("/api/v1/address", addressRouter);

app.use("/api/v1/products", productRouter);

app.use("/api/v1/orders", orderRouter);

// app.use("/api/v1/reviews", reviewRouter);

app.use("/api/v1/cart", cartRouter);

app.use("/api/v1/category", CategoryRouter);

app.all("*", (req, res) => {
  res.status(404).json(new ApiResponse(404, {}, "Route not found"));
});

app.use(globalErrorHandler);

export default app;
