import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail } from "../email/email.js";
import jwt from "jsonwebtoken";

// Generate verification token with JWT
const generateVerificationToken = (userId, type) => {
  return jwt.sign(
    {
      _id: userId,
      type: type, // Either "email-verification" or "password-reset"
    },
    process.env.TOKEN_SECRET,
    {
      expiresIn: process.env.VERIFICATION_TOKEN_EXPIRY || "1h",
    }
  );
};
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: strict,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// Handle user registration with email verification
const registerUser = asyncHandler(async (req, res) => {
  console.log("hi");
  const { fullName, email, mobile, password } = req.body;

  if ([fullName, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ mobile }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or mobile already exists");
  }

  // Create user without tokens first
  const user = await User.create({
    fullName,
    email,
    password,
    mobile,
  });

  // Generate verification token
  const verificationToken = await generateVerificationToken(
    user._id,
    "email-verification"
  );

  // Store token hash in user document
  user.verificationToken = verificationToken;
  await user.save();

  // Create verification URL
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  // Create email message
  const message = `
    <h1>Verify Your Email</h1>
    <p>Please click on the link below to verify your email address:</p>
    <a href="${verificationUrl}" target="_blank">Verify Email</a>
    <p>If you did not request this, please ignore this email.</p>
    <p>${verificationToken}</p>
    <p>This link will expire in ${
      process.env.VERIFICATION_TOKEN_EXPIRY || "1 hour"
    }.</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Email Verification",
      message,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -verificationToken -resetPasswordToken"
    );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          createdUser,
          "User registered. Please verify your email address."
        )
      );
  } catch (error) {
    // Delete user if email fails to send
    await User.findByIdAndDelete(user._id);

    throw new ApiError(500, "Failed to send verification email");
  }
});

// Verify user email
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

  // Check token type
  if (decoded.type !== "email-verification") {
    throw new ApiError(400, "Invalid token type");
  }

  // Token is expired
  if (decoded.exp < Date.now() / 1000) {
    const verificationToken = generateVerificationToken(
      decoded._id,
      "email-verification"
    );

    // Store token hash in user document
    const user = await User.findById(decoded._id);
    user.verificationToken = verificationToken;
    await user.save();

    console.log(user);

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // Create email message
    const message = ` 
      <h1>Verify Your Email</h1>
      <p>Please click on the link below to verify your email address:</p>
      <a href="${verificationUrl}" target="_blank">Verify Email</a>
      <p>If you did not request this, please ignore this email.</p>
      <p>This link will expire in ${
        process.env.VERIFICATION_TOKEN_EXPIRY || "1 hour"
      }.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: "Email Verification",
      message,
    });
  }

  // Find user with the verification token
  const user = await User.findOne({
    _id: decoded._id,
    verificationToken: token,
  });

  console.log(user);

  if (!user) {
    throw new ApiError(400, "Invalid verification token");
  }

  user.status = "Active";
  user.verificationToken = "";
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Email verified successfully"));
});

// Request password reset
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Generate reset token with JWT
  const resetToken = generateVerificationToken(user._id, "password-reset");

  // Save token to user document
  user.resetPasswordToken = resetToken;
  await user.save();

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  // Create email message
  const message = `
    <h1>Password Reset Request</h1>
    <p>Please click on the link below to reset your password:</p>
    <a href="${resetUrl}" target="_blank">Reset Password</a>
    <p>If you did not request this, please ignore this email.</p>
    <p>This link will expire in ${
      process.env.VERIFICATION_TOKEN_EXPIRY || "1 hour"
    }.</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset email sent successfully"));
  } catch (error) {
    user.resetPasswordToken = "";
    await user.save();

    throw new ApiError(500, "Failed to send password reset email");
  }
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, mobile, password } = req.body;

  if (!mobile && !email) {
    throw new ApiError(400, "Email or mobile is required");
  }

  const user = await User.findOne({
    $or: [{ mobile }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Check if user has verified their email
  if (user.status === "Inactive") {
    const verificationToken = generateVerificationToken(
      user._id,
      "email-verification"
    );

    user.verificationToken = verificationToken;

    await user.save();

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // Create email message
    const message = `
      <h1>Verify Your Email</h1>
      <p>Please click on the link below to verify your email address:</p>
      <a href="${verificationUrl}" target="_blank">Verify Email</a>
      <p>If you did not request this, please ignore this email.</p>
      <p>This link will expire in ${
        process.env.VERIFICATION_TOKEN_EXPIRY || "6 hour"
      }.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Email Verification",
        message,
      });

      return res
        .status(403)
        .json(new ApiResponse(200, {}, "Verification email sent successfully"));
    } catch (error) {
      throw new ApiError(500, "Failed to send verification email");
    }
  }

  // Check if user account is suspended
  if (user.status === "Suspended") {
    throw new ApiError(
      403,
      "Your account has been suspended. Please contact support."
    );
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -verificationToken -resetPasswordToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, mobile } = req.body;

  if (!fullName && !email) {
    throw new ApiError(400, "Full name or email is required.");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email, mobile } },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken -verificationToken -resetPasswordToken"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details fetched successfully"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  console.log(req.body);
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    // Check token type

    if (decoded.type !== "password-reset") {
      throw new ApiError(400, "Invalid token type");
    }

    // Find user with valid reset token
    const user = await User.findOne({
      _id: decoded._id,
      resetPasswordToken: token,
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    // Update password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = ""; // Clear the token to invalidate it
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset successfully"));
  } catch (error) {
    throw new ApiError(400, "Invalid or expired reset token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  const user = await User.findById(req.user._id);

  const isPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  user.password = newPassword;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export {
  registerUser,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  logoutUser,
  updateAccountDetails,
  getCurrentUser,
  changePassword,
};
