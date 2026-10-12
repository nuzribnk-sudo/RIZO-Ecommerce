
const bcrypt = require("bcryptjs");

const User = require("../models/User");

// ================= GET PROFILE =================

const getProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// ================= UPDATE PROFILE =================

const updateProfile = async (userId, data) => {
  const allowedFields = ["name", "phone"];

  const updates = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    userId,
    updates,
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  if (user.name && user.phone) {
    user.profileCompleted = true;
    await user.save();
  }

  return user;
};

// ================= GET ALL USERS =================

const getAllUsers = async ({
  search,
  page = 1,
  limit = 10,
  sort = "newest",
  status,
}) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const itemsPerPage = Math.max(Number(limit) || 10, 1);

  const skip = (currentPage - 1) * itemsPerPage;

  const filter = {
    role: "user",
  };

  // ================= SEARCH =================

  if (search && search.trim()) {
    const searchValue = search.trim();

    filter.$or = [
      {
        name: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        email: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  // ================= STATUS FILTER =================

  if (status) {
    const normalizedStatus = status.toLowerCase();

    if (
      normalizedStatus !== "active" &&
      normalizedStatus !== "blocked"
    ) {
      throw new Error(
        "Status must be active or blocked"
      );
    }

    filter.status = normalizedStatus;
  }

  // ================= SORT =================

  let sortOption = {};

  switch (sort) {
    case "name_asc":
      sortOption = { name: 1 };
      break;

    case "name_desc":
      sortOption = { name: -1 };
      break;

    case "newest":
      sortOption = { createdAt: -1 };
      break;

    case "oldest":
      sortOption = { createdAt: 1 };
      break;

    default:
      throw new Error(
        "Sort must be name_asc, name_desc, newest or oldest"
      );
  }

  // ================= TOTAL USERS =================

  const total = await User.countDocuments(filter);

  // ================= GET USERS =================

  const users = await User.find(filter)
    .select(
      "-password -otp -otpExpiresAt -otpAttempts -resetOtp -resetOtpExpiresAt"
    )
    .sort(sortOption)
    .skip(skip)
    .limit(itemsPerPage);

  const totalPages = Math.ceil(total / itemsPerPage);

  return {
    users,
    total,
    page: currentPage,
    limit: itemsPerPage,
    totalPages,
  };
};

// ================= UPDATE USER STATUS =================

const updateUserStatus = async (userId, status) => {
  const normalizedStatus = status
    ? status.toLowerCase()
    : "";

  if (
    normalizedStatus !== "active" &&
    normalizedStatus !== "blocked"
  ) {
    throw new Error(
      "Status must be active or blocked"
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "admin") {
    throw new Error(
      "Admin status cannot be changed"
    );
  }

  user.status = normalizedStatus;

  await user.save();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    profileCompleted: user.profileCompleted,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// ================= CHANGE PASSWORD =================

const changePassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!currentPassword || !newPassword) {
    throw new Error(
      "Current password and new password are required"
    );
  }

  if (newPassword.length < 6) {
    throw new Error(
      "New password must be at least 6 characters"
    );
  }

  if (currentPassword === newPassword) {
    throw new Error(
      "New password must be different from current password"
    );
  }

  if (!user.password) {
    throw new Error(
      "This account does not have a password. Please use Google Login."
    );
  }

  const passwordMatch = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!passwordMatch) {
    throw new Error("Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, 10);

  await user.save();

  return {
    message: "Password changed successfully",
  };
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserStatus,
  changePassword,
};
