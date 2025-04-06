import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE,
  port: process.env.SMTP_PORT,
  secure: true,
  host: process.env.SMTP_HOST,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});
export const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};
