import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";

// توسيع واجهة Request لتمرير بيانات الجلسة والمستخدم إلى المتحكمات اللاحقة
declare global {
  namespace Express {
    interface Request {
      user?: any;
      session?: any;
    }
  }
}

// 1. برمجية وسيطة للتحقق من تسجيل الدخول فقط (لأي مستخدم)
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - Access denied. Please login first.",
      });
      return;
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
};

// 2. برمجية وسيطة للتحقق من رتبة الأدمن حصراً
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - Access denied. Please login first.",
      });
      return;
    }

    // فحص رتبة المستخدم
    if (session.user.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Forbidden - You do not have permission to access admin resources.",
      });
      return;
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    console.error("Admin authorization middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during admin authorization",
    });
  }
};