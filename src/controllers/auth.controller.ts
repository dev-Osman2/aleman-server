import { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";
import { prisma } from "../prisma";

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

// 2. تسجيل الدخول عبر البريد الإلكتروني أو رقم الهاتف (Login)
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // نقبل الحقل سواء أرسله الفرونت إند باسم identifier أو email أو phone
    const { identifier, email, phone, password } = req.body;
    const loginInput = (identifier || email || phone || "").trim();

    if (!loginInput || !password) {
      res.status(400).json({
        success: false,
        message: "يرجى إدخال البريد الإلكتروني (أو رقم الهاتف) وكلمة المرور",
      });
      return;
    }

    let targetEmail = loginInput;

    // إذا كان المدخل لا يحتوي على '@' فهذا يعني أن المستخدم أدخل رقم هاتفه
    if (!loginInput.includes("@")) {
      const userByPhone = await prisma.user.findUnique({
        where: { phone: loginInput },
        select: { email: true },
      });

      if (!userByPhone) {
        res.status(401).json({
          success: false,
          message: "رقم الهاتف أو كلمة المرور غير صحيحة",
        });
        return;
      }

      targetEmail = userByPhone.email;
    }

    // التحقق من صحة كلمة المرور وإنشاء توكن الجلسة عبر Better Auth
    const response = await auth.api.signInEmail({
      body: {
        email: targetEmail,
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
      message: "بيانات الدخول غير صحيحة، تأكد من الإيميل/الهاتف وكلمة المرور",
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

// 4. تعديل بيانات المستخدم الحالي (Update User Profile)
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // التحقق من صحة الجلسة وصاحب التوكن أولاً
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - Please login first",
      });
      return;
    }

    const { name, phone } = req.body;

    // التأكد من إرسال حقل واحد على الأقل للتعديل
    if (!name && !phone) {
      res.status(400).json({
        success: false,
        message: "Please provide at least a name or phone to update",
      });
      return;
    }

    // إذا أراد المستخدم تغيير رقم الهاتف، نتأكد أنه غير مستخدم من حساب آخر
    if (phone && phone !== session.user.phone) {
      const phoneTaken = await prisma.user.findUnique({
        where: { phone },
      });

      if (phoneTaken) {
        res.status(409).json({
          success: false,
          message: "This phone number is already registered by another account",
        });
        return;
      }
    }

    // تنفيذ أمر التعديل الفعلي في PostgreSQL عبر Prisma
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id, // التعديل لحساب صاحب التوكن فقط
      },
      data: {
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating profile",
    });
  }
};

// 5. حذف الحساب وجلساته بالكامل (Delete User Account)
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    // التحقق من صاحب التوكن
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - Please login first",
      });
      return;
    }

    const userId = session.user.id;

    // فحص ما إذا كان للمستخدم طلبات سابقة في المتجر
    const userOrdersCount = await prisma.order.count({
      where: { userId },
    });

    if (userOrdersCount > 0) {
      res.status(400).json({
        success: false,
        message: "Cannot delete account with existing purchase orders for auditing reasons",
      });
      return;
    }

    // تنفيذ الحذف عبر Prisma
    // بسبب وجود onDelete: Cascade، سيقوم PostgreSQL تلقائياً بحذف الجلسات (Sessions) وحسابات الدخول (Accounts) المرتبطة
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({
      success: true,
      message: "Account and associated sessions deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting account",
    });
  }
};