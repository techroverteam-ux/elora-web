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
    // 1. Accept 'roles' array instead of single 'roleId'
    const { name, email, password, roles } = req.body;

    // 2. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "User with this email already exists" });
      return;
    }

    // 3. Validate Roles
    // Ensure 'roles' is an array and not empty
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      res.status(400).json({ message: "At least one role is required" });
      return;
    }

    // Check if all provided Role IDs exist in DB
    const foundRoles = await Role.find({ _id: { $in: roles } });
    if (foundRoles.length !== roles.length) {
      res.status(400).json({ message: "One or more Invalid Role IDs" });
      return;
    }

    // 4. Create User
    const user = await User.create({
      name,
      email,
      password,
      roles: roles, // Save array of IDs
    });

    // Populate roles for response
    await user.populate("roles", "name");

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles, // Return array
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

    const users = await User.find({})
      .select("-password")
      .populate("roles", "name code") // Changed 'role' to 'roles'
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
      .populate("roles", "name code permissions"); // Changed 'role' to 'roles'

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// --- NEW FUNCTION: Get Users by Role Code ---
export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const { roleCode } = req.params;
    const searchString = String(roleCode).toUpperCase();

    // Find the Role ID first
    const role = await Role.findOne({
      $or: [{ code: searchString }, { name: searchString }],
    });

    if (!role) {
      return res
        .status(404)
        .json({ message: `Role '${searchString}' not found` });
    }

    // Find users where 'roles' array CONTAINS this role._id
    // MongoDB automatically handles searching inside arrays with this syntax
    const users = await User.find({
      roles: role._id,
      isActive: true,
    }).select("name email mobile roles");

    res.status(200).json({ users });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: error.message });
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
    const { name, email, roles, isActive, password } = req.body; // 'roles' instead of 'roleId'

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Update basic fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.isActive = isActive !== undefined ? isActive : user.isActive;

    // Handle Roles Change
    if (roles) {
      if (!Array.isArray(roles) || roles.length === 0) {
        res.status(400).json({ message: "Roles must be a non-empty array" });
        return;
      }

      // Verify all new roles exist
      const foundRoles = await Role.find({ _id: { $in: roles } });
      if (foundRoles.length !== roles.length) {
        res.status(400).json({ message: "One or more Invalid Role IDs" });
        return;
      }

      user.roles = roles as any; // Update array
    }

    // Handle Password Change
    if (password) {
      user.password = password;
    }

    await user.save();

    // Populate for response
    await user.populate("roles", "name");

    res.status(200).json({
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        roles: user.roles,
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
