// import Admin from "../models/Admin.js";
// import jwt from "jsonwebtoken";
// // import bcrypt from "bcryptjs";

// // generating jwt token using email and id
// const maxAge = 3 * 24 * 60 * 60 * 1000;
// const generateToken = (email, Id) => {
//   return jwt.sign({ email, Id }, process.env.JWT_KEY, { expiresIn: maxAge });
// };

// // Register Admin
// export const registerAdmin = async (req, res) => {
//   try {
//     const { name, email, password, department } = req.body;
//     // email and password validation , should no be empty
//     if (!email || !password || !name || !department) {
//       return response
//         .status(400)
//         .send("Name, Email, Password and Department is required.");
//     }
//     // checking if that email exists already
//     const exists = await Admin.findOne({ email });
//     if (exists)
//       return res.status(400).json({ message: "Admin already exists" });
//     //creating admin instance
//     const admin = await Admin.create({ name, email, password, department });
//     // generating and setting jwt token in http response header
//     // const token = generateToken(admin._id);

//     response.cookie("jwt", generateToken(email, admin.id), {
//       maxAge,
//       secure: true,
//       sameSite: "None",
//     });
//     // sending response
//     response.status(201).json({
//       admin: {
//         id: admin.id,
//         email: admin.email,
//         name: admin.name,
//         department: admin.department,
//       },
//     });
//   } catch (error) {
//     console.log("Error during signup/register:", error);
//     console.error("Error during signup/register:", error);
//     return response.status(500).send("Internal Server Error");
//   }
// };

// export const loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return response.status(400).send("Email and Password is required.");
//     }

//     const admin = await Admin.findOne({ email });
//     if (!admin)
//       return res.status(404).send("User with the given email not found.");

//     const isMatch = await admin.comparePassword(password);
//     if (!isMatch)
//       return res.status(401).json({ message: "Incorrect Password" });

//     //const token = generateToken(admin._id);
//     response.cookie("jwt", generateToken(email, admin.id), {
//       maxAge,
//       secure: true,
//       sameSite: "None",
//     });
//     //res.status(200).json({ token, admin });
//     res.status(200).json({
//       admin: {
//         id: admin.id,
//         email: admin.email,
//         name: admin.name,
//         department: admin.department,
//       },
//     });
//   } catch (error) {
//     console.log({ error });
//     return response.status(500).send("Internal Server Error");
//   }
// };

// // Get current logged-in admin
// export const getCurrentAdmin = async (req, res) => {
//   const admin = await Admin.findById(req.user.id).select("-password");
//   res.status(200).json(admin);
// };

// // Delete admin account
// export const deleteAdmin = async (req, res) => {
//   await Admin.findByIdAndDelete(req.user.id);
//   res.status(200).json({ message: "Admin deleted" });
// };

// export const logoutAdmin = async (req, res) => {
//   await Admin.findByIdAndDelete(req.user.id);
//   res.status(200).json({ message: "Admin deleted" });
// };

// export const logout = async (request, response, next) => {
//   try {
//     // response.cookie("jwt","",{maxAge:1, secure:true, sameSite:"None"});
//     res.clearCookie("jwt", {
//       secure: true,
//       sameSite: "None",
//     });
//     return response.status(200).send("Logout sucessfull");
//   } catch (error) {
//     console.log({ error });
//     return response.status(500).send("Internal Server Error");
//   }
// };

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
