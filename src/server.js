import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./database/db.js";
import listEndpoints from "express-list-endpoints";

console.log("📌 All Registered Routes:");
console.table(listEndpoints(app));

dotenv.config({ path: "../env" });

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3333, () => {
      console.log("server is running on port", process.env.PORT);

      app.on("error", (error) => {
        console.log("ERROR:", error);
        throw error;
      });
    });
  })
  .catch((error) => {
    console.log("Mongo db failed connection !", error);
  });
