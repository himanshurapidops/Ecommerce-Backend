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
      expiresIn: process.env.VERIFICATION_TOKEN_EXPIRY || "1h", // Default 1 hour
    }
  );
};

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request. Refresh token is required.");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token. User not found.");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used.");
    }

    const options = {
      httpOnly: true,
      // secure: true,
      sameSite: "Strict",
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken },
          "Access token refreshed successfully."
        )
      );
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Refresh token expired. Please log in again.");
    }
    throw new ApiError(401, error?.message || "Invalid refresh token.");
  }
});

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, password } = req.body;

  if (
    [fullName, email, mobile, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ mobile }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or mobile already exists");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    mobile,
  });

  const verificationToken = generateVerificationToken(
    user._id,
    "email-verification"
  );

  user.verificationToken = verificationToken;
  await user.save();

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  const message = `
    <h1>Verify Your Email</h1>
    <p>Please click on the link below to verify your email address:</p>
    <a href="${verificationUrl}" target="_blank">Verify Email</a>
    <p>If you did not request this, please ignore this email.</p>
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
      "-password -refreshToken -verificationToken"
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
    await User.findByIdAndDelete(user._id);
    throw new ApiError(500, "Failed to send verification email");
  }
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

  if (decoded.type !== "email-verification") {
    throw new ApiError(400, "Invalid token type");
  }

  const user = await User.findById(decoded._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status === "Active") {
    return res
      .status(200)
      .json(new ApiResponse(200, "Email is already verified"));
  }

  if (decoded.exp < Date.now() / 1000) {
    const newToken = generateVerificationToken(user._id, "email-verification");
    user.verificationToken = newToken;
    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${newToken}`;
    const message = `
      <h1>Verify Your Email</h1>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationUrl}" target="_blank">Verify Email</a>
      <p>This link expires in ${
        process.env.VERIFICATION_TOKEN_EXPIRY || "1 hour"
      }.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: "New Email Verification Link",
      message,
    });

    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          "Verification token expired. A new email has been sent."
        )
      );
  }

  user.status = "Active";
  user.verificationToken = "";
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Email verified successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "If the email is valid, a password reset link has been sent."
        )
      );
  }

  const resetToken = generateVerificationToken(user._id, "password-reset");

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

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

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour expiry
    await user.save();
  } catch (error) {
    throw new ApiError(500, "Failed to send password reset email");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "If the email is valid, a password reset link has been sent."
      )
    );
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
  let { email, mobile, password } = req.body;

  if (!email && !mobile) {
    throw new ApiError(400, "Email or mobile number is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  if (email) {
    email = email.toLowerCase();
  }

  const user = await User.findOne({
    $or: [{ mobile }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (user.status === "Inactive") {
    const verificationToken = generateVerificationToken(
      user._id,
      "email-verification"
    );

    user.verificationToken = verificationToken;

    user.save();

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
        .json(
          new ApiResponse(
            200,
            {},
            "Email is not Verified. new Verification email has been sent successfully"
          )
        );
    } catch (error) {
      throw new ApiError(500, "Failed to send verification email");
    }
  }

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
          refreshToken,
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
        refreshToken: "",
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, mobile } = req.body;

  if (!fullName || !email || !mobile) {
    throw new ApiError(400, "All field are required");
  }

  if (email) {
    email = email.toLowerCase();
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
        mobile,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken -verificationToken -resetPasswordToken");

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .cookie("accessToken", req.cookies.accessToken, options)
    .cookie("refreshToken", req.cookies.refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user,
        },
        "account details updated successfully"
      )
    );
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
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    if (decoded.type !== "password-reset") {
      throw new ApiError(400, "Invalid token type");
    }

    const user = await User.findOne({
      _id: decoded._id,
      resetPasswordToken: token,
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = password;
    user.resetPasswordToken = "";
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset successfully"));
  } catch (error) {
    throw new ApiError(400, "Invalid or expired reset token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "conform password and newpassword are not same   ");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid old password");
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
