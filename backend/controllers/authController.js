import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Generate JWT Token (matching your cookie name 'jwt')
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (request, response) => {
  try {
    const { name, email, password, role, organization, phoneNumber } =
      request.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response.status(400).send("User already exists with this email");
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "user",
      organization,
      phoneNumber,
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set cookie (matching your cookie name 'jwt')
    response.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send notifications
    try {
      const { notifyAccountCreated, notifyWelcomeNewUser, notifyAdminNewUser } = await import("../services/notificationService.js");
      
      // Notify user with welcome and account created messages
      await Promise.all([
        notifyAccountCreated(user._id),
        notifyWelcomeNewUser(user._id, user.name),
      ]);

      // Notify system admins of new user
      await notifyAdminNewUser(user._id, user.name, user.email);
    } catch (notifError) {
      console.error("Error sending registration notifications:", notifError);
      // Don't fail the request if notifications fail
    }

    return response.status(201).json({
      user,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return response.status(500).send(error.message || "Error registering user");
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (request, response) => {
  try {
    const { email, password } = request.body;

    // Validate input
    if (!email || !password) {
      return response.status(400).send("Please provide email and password");
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return response.status(401).send("Invalid email or password");
    }

    // Check if account is active
    if (!user.isActive) {
      return response
        .status(403)
        .send("Your account has been deactivated. Please contact admin.");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return response.status(401).send("Invalid email or password");
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set cookie (matching your cookie name 'jwt')
    response.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Remove password from response
    const userResponse = user.toJSON();
    return response.status(200).json({
      user: userResponse,
      token: token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return response.status(500).send("Error logging in");
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (request, response) => {
  try {
    response.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    return response.status(200).send("Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    return response.status(500).send("Error logging out");
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (request, response) => {
  try {
    const user = await User.findById(request.userId);

    if (!user) {
      return response.status(404).send("User not found");
    }

    return response.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return response.status(500).send("Error fetching profile");
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (request, response) => {
  try {
    const { name, organization, phoneNumber, profileImage } = request.body;

    const user = await User.findById(request.userId);

    if (!user) {
      return response.status(404).send("User not found");
    }

    // Update fields
    if (name) user.name = name;
    if (organization) user.organization = organization;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    return response.status(200).json({
      user,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return response.status(500).send("Error updating profile");
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (request, response) => {
  try {
    const { currentPassword, newPassword } = request.body;

    if (!currentPassword || !newPassword) {
      return response
        .status(400)
        .send("Please provide current and new password");
    }

    const user = await User.findById(request.userId).select("+password");

    if (!user) {
      return response.status(404).send("User not found");
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return response.status(401).send("Current password is incorrect");
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return response.status(200).send("Password changed successfully");
  } catch (error) {
    console.error("Change password error:", error);
    return response.status(500).send("Error changing password");
  }
};
