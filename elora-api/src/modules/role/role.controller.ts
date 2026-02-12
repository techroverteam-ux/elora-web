import { Request, Response } from "express";
import Role, { RoleDocument } from "./role.model";
import * as XLSX from "xlsx";

// @desc    Create a new role
// @route   POST /api/v1/roles
// @access  Private (Admin)
export const createRole = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, code, permissions } = req.body;

    // 1. Check if role code already exists
    const roleExists = await Role.findOne({ code });
    if (roleExists) {
      res.status(400).json({ message: "Role with this code already exists" });
      return;
    }

    // 2. Create Role
    // Note: Mongoose automatically casts the 'permissions' object to a Map
    const role = await Role.create({
      name,
      code,
      permissions,
    });

    res.status(201).json({ message: "Role created successfully", role });
  } catch (error) {
    console.error("Create Role Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all roles
// @route   GET /api/v1/roles
// @access  Private (Admin)
export const getAllRoles = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const roles = await Role.find({});
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get single role by ID
// @route   GET /api/v1/roles/:id
// @access  Private (Admin)
export const getRoleById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      res.status(404).json({ message: "Role not found" });
      return;
    }
    res.status(200).json(role);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update role
// @route   PUT /api/v1/roles/:id
// @access  Private (Admin)
export const updateRole = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, permissions, isActive } = req.body;

    const role = await Role.findById(req.params.id);
    if (!role) {
      res.status(404).json({ message: "Role not found" });
      return;
    }

    // Prevent updating the Super Admin code/critical permissions if necessary
    // For now, we allow updates but usually, we protect the 'super_admin' role
    if (
      role.code === "super_admin" &&
      req.body.code &&
      req.body.code !== "super_admin"
    ) {
      res
        .status(400)
        .json({ message: "Cannot change the code of Super Admin" });
      return;
    }

    role.name = name || role.name;
    role.isActive = isActive !== undefined ? isActive : role.isActive;

    // Update permissions if provided
    if (permissions) {
      role.permissions = permissions;
    }

    await role.save();
    res.status(200).json({ message: "Role updated successfully", role });
  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete role
// @route   DELETE /api/v1/roles/:id
// @access  Private (Admin)
export const deleteRole = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      res.status(404).json({ message: "Role not found" });
      return;
    }

    if (role.code === "super_admin") {
      res.status(400).json({ message: "Cannot delete Super Admin role" });
      return;
    }

    await role.deleteOne();
    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Export roles to Excel
// @route   GET /api/v1/roles/export
// @access  Private (Admin)
export const exportRoles = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const roles = await Role.find({});

    const data = roles.map((role: any) => ({
      "Role ID": role._id.toString(),
      Name: role.name,
      Code: role.code,
      Permissions: JSON.stringify(role.permissions || {}), // Flatten permissions
      Status: role.isActive ? "Active" : "Inactive",
      "Created At": new Date(role.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Roles");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=Roles.xlsx");
    res.send(buffer);
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ message: "Failed to export roles" });
  }
};
