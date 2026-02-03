import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../modules/user/user.model";

interface JwtPayload {
  userId: string; // Change 'id' to 'userId'
  role: any;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Explicitly return Promise<void> for Express 5/Async handlers
  try {
    let token;

    // 1. Check if token exists in Cookies OR Authorization Header
    if (req.cookies.access_token) {
      token = req.cookies.access_token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({ message: "Not authorized, no token provided" });
      return;
    }

    // 2. Verify Token
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as JwtPayload;

    // 3. Find User & Populate Role (Critical for RBAC)
    const user = await User.findById(decoded.userId)
      .populate("role")
      .select("-password");

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: "User account is inactive" });
      return;
    }

    // 4. Attach to Request
    // We cast it because we know we populated the role
    req.user = user as any;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
