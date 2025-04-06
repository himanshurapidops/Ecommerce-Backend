import cron from "node-cron";
import Product from "../models/product.model.js";
import { sendEmail } from "../email/email.js";

cron.schedule("0 20 * * *", async () => {
  console.log("Running daily stock check...");

  const products = await Product.find();

  if (products.length === 0) {
    console.log("No products found.");
    return;
  }

  const emailHTML = generateStockReportEmail(products);

  const option = {
    from: process.env.SMTP_EMAIL,
    to: "himanshuisherenow@gmail.com",
    subject: "📦 Daily Product Stock Report",
    html: emailHTML,
  };
  console.log(option);

  await sendEmail(option);
});

setInterval(async () => {
  const products = await Product.find();
  const emailHTML = generateStockReportEmail(products);

  const option = {
    from: process.env.SMTP_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: "📦 Daily Product Stock Report",
    html: emailHTML,
  };

  await sendEmail(option);
}, 4000);

function generateStockReportEmail(products) {
  const rows = products
    .map(
      (product) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${product.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.countInStock}</td>
    </tr>
  `
    )
    .join("");

  console.log("Generated HTML rows:", rows);
  return `
    <div>
      <h2 style="background-color: #4CAF50; color: white; padding: 10px;">
        Daily Product Stock Report
      </h2>
      <p>Hello Admin, </p>
      <p>Here is the current stock status:</p>

      <table style="width: 100%; border: 1px solid #000; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #000; padding: 10px;">Product Name</th>
            <th style="border: 1px solid #000; padding: 10px;">Stock Left</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <p>Regards,<br>Your E-commerce System</p>
    </div>
  `;
}
