import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import addressRouter from "./routes/address.routes.js";

import morgan from "morgan";

const app = express();

// const stream = {
//   write: (message) => {
//     logger.info(message.trim());
//   },
// };

// app.use(morgan("combined", { stream }));

app.use(cors());
app.use(cookieParser());
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use(express.static("public"));

//routes import

//routes declaration

app.use("/api/v1/user", userRouter);

app.use("/api/v1/address", addressRouter);

export default app;
