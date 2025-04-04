import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE,
  port: 678,
  secure: true,
  host: "smpt.gmail.com",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});
export const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.SMPT_EMAIL,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};
