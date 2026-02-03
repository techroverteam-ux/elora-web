import { Request, Response } from "express";
import User from "./user.model";
import Role from "../role/role.model";

// @desc    Create a new user (Admin only)
// @route   POST /api/v1/users
// @access  Private (Admin with 'users.create' permission)
export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password, roleId } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "User with this email already exists" });
      return;
    }

    // 2. Validate Role
    const role = await Role.findById(roleId);
    if (!role) {
      res.status(400).json({ message: "Invalid Role ID" });
      return;
    }

    // 3. Create User
    const user = await User.create({
      name,
      email,
      password, // Pre-save hook will hash this
      role: roleId,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: role.name,
      },
    });
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all users with pagination
// @route   GET /api/v1/users
// @access  Private (Admin with 'users.view' permission)
export const getAllUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch users and populate their Role name
    const users = await User.find({})
      .select("-password") // Exclude password
      .populate("role", "name code")
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get single user by ID
// @route   GET /api/v1/users/:id
// @access  Private
export const getUserById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("role", "name code permissions");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update user details
// @route   PUT /api/v1/users/:id
// @access  Private (Admin with 'users.edit' permission)
export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, roleId, isActive, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.isActive = isActive !== undefined ? isActive : user.isActive;

    // Handle Role Change
    if (roleId) {
      const roleExists = await Role.findById(roleId);
      if (!roleExists) {
        res.status(400).json({ message: "Invalid Role ID" });
        return;
      }
      user.role = roleId;
    }

    // Handle Password Change (Only if provided)
    if (password) {
      user.password = password; // The pre-save hook will detect modification and hash it
    }

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin with 'users.delete' permission)
export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Prevent deleting yourself
    // We cast req.user._id to string for comparison
    if (user._id.toString() === (req.user as any)._id.toString()) {
      res.status(400).json({ message: "You cannot delete your own account." });
      return;
    }

    await user.deleteOne();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
