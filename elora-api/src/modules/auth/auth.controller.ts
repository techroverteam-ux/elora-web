import { Request, Response } from "express";
import User from "../user/user.model";
import { generateAccessToken } from "../../utils/jwt";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("role");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateAccessToken({
      userId: user._id,
      role: user.role,
    });

    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // true in production
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: error.message || 'Login failed',
        stack: error.stack
      }
    });
  }
};

// @desc    Logout user / Clear cookie
// @route   POST /api/v1/auth/logout
// @access  Public
export const logout = (_req: Request, res: Response) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    sameSite: "strict",
    secure: false, // Ensure this matches your login cookie settings
  });

  res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // The user is already attached to req by the 'protect' middleware
    // We send it back to the frontend
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
