import { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";

// 1. إنشاء حساب جديد (Register)
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
      res.status(400).json({
        success: false,
        message: "All fields are required (name, phone, email, password)",
      });
      return;
    }

    // استدعاء Better Auth لإنشاء المستخدم وتشفير الباسوورد وتوليد الجلسة
    const response = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        phone, // يمرر تلقائياً إلى additionalFields
      },
      asResponse: false,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: response,
    });
  } catch (error: any) {
    console.error("Error registering user with Better Auth:", error);
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to register user",
    });
  }
};

// 2. تسجيل الدخول (Login)
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    // التحقق من صحة البيانات وإنشاء توكن الجلسة (Session Token)
    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      asResponse: false,
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: response,
    });
  } catch (error: any) {
    console.error("Error logging in:", error);
    res.status(401).json({
      success: false,
      message: error?.message || "Invalid email or password",
    });
  }
};

// 3. التحقق من بيانات المستخدم الحالي من خلال التوكن (Get Current Session)
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // تحويل req.headers الخاصة بـ Express لتنسيق Better Auth
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - No active session",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching session",
    });
  }
};