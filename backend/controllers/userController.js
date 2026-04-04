import User from "../models/User.js";

// ===== GET USER STATISTICS (Total Users & Admins) =====
export const getUserStatistics = async (req, res) => {
  try {
    // Count all users with role "user"
    const totalUsers = await User.countDocuments({ role: "user" });

    // Count all users with role "admin"
    const totalAdmins = await User.countDocuments({ role: "admin" });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
      },
    });
  } catch (error) {
    console.error("Get User Statistics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics",
    });
  }
};

// ===== GET RECENT USERS (Latest 3 users with role "user") =====
export const getRecentUsers = async (req, res) => {
  try {
    const { limit = 3 } = req.query;

    const recentUsers = await User.find({ role: "user" })
      .select("_id name email organization createdAt profileImage")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: recentUsers,
    });
  } catch (error) {
    console.error("Get Recent Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent users",
    });
  }
};

// ===== GET ALL USERS (Admin only) =====
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;

    let query = {};

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// ===== GET USER BY ID =====
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// ===== UPDATE USER =====
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, organization, phoneNumber, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        organization,
        phoneNumber,
        profileImage,
      },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// ===== DELETE USER =====
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// ===== TOGGLE USER ACTIVE =====
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true },
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

// ===== UPDATE USER ROLE (Admin only) =====
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'user' or 'admin'",
      });
    }

    // Prevent admin from demoting themselves
    if (req.user._id.toString() === userId && role === "user") {
      return res.status(400).json({
        success: false,
        message: "You cannot demote yourself from admin role",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      data: user,
    });
  } catch (error) {
    console.error("Update User Role Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};
