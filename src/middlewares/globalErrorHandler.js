import { ApiResponse } from "../utils/ApiResponse.js";

const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res
    .status(statusCode)
    .json(
      new ApiResponse(
        statusCode,
        err.message || "Internal Server Error",
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined
      )
    );
};

export default globalErrorHandler;
