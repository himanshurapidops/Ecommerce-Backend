import cron from "node-cron";
import Product from "../models/product.model.js";
import { sendEmail } from "../utils/email.js";

cron.schedule("0 20 * * *", async () => {
  // Runs every day at 8 PM
  console.log("Running daily stock check...");

  const products = await Product.find();
  let stockReport = "Daily Stock Report:\n\n";

  products.forEach((product) => {
    stockReport += `${product.name}: ${product.stock} left\n`;
  });

  await sendEmail("admin@example.com", "📊 Daily Stock Report", stockReport);
});
