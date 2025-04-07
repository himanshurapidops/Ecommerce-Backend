# Node.js Express API Project

A Node.js/Express application built by Himanshu Chavda with authentication, payment processing via Stripe, and Cloudinary file handling.

## Features

- 🔐 User authentication with JWT tokens (access and refresh tokens)
- 💳 Payment processing with Stripe
- 📁 File upload functionality with Cloudinary
- 📧 Email notifications
- 🗃️ MongoDB integration
- 🔍 Input validation with express-validator
- 📝 Logging with morgan and winston

## Prerequisites

- Node.js (v14 or higher recommended)
- MongoDB instance (local or Atlas)
- npm package manager

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Training-Rapidops/Himanshu-Chavda.git
   cd Himanshu-Chavda
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   # Port configuration
   PORT=3333

   # Database configuration
   MONGO_URI=mongodb://localhost:27017/your_database

   # Authentication tokens
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   REFRESH_TOKEN_EXPIRY=7d
   ACCESS_TOKEN_SECRET=your_access_token_secret
   ACCESS_TOKEN_EXPIRY=1d
   JWT_SECRET=your_jwt_secret
   TOKEN_SECRET=your_token_secret

   # Email configuration
   SMTP_SERVICE=gmail
   SMTP_EMAIL=your_email@gmail.com
   SMTP_PASSWORD=your_email_password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587

   # Email info
   EMAIL_FROM=your_name <your_email@gmail.com>
   ADMIN_EMAIL=admin@example.com

   # Cloudinary configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name

   # Stripe configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key

   # CORS configuration
   CORS_ORIGIN=*
   ```

## Running the Application

### Development Mode

```bash
npm start
```

This will start the server with nodemon on port 3333, which automatically restarts when file changes are detected.

## API Documentation

Start the server and explore the available endpoints. The project uses express-list-endpoints to show all available routes.

## Technologies Used

- **Express**: Fast, unopinionated, minimalist web framework for Node.js
- **Mongoose**: MongoDB object modeling tool
- **JWT**: JSON Web Tokens for secure authentication
- **bcryptjs**: Library for hashing passwords
- **Cloudinary**: Cloud service for image and video management
- **Stripe**: Payment processing platform
- **Nodemailer**: Module for sending emails
- **Winston**: Logging library
- **Morgan**: HTTP request logger middleware
