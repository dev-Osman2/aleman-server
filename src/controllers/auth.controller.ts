import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. استخراج الحقول المطلوبة من Body الطلب
    const { name, phone, email, password } = req.body;

    // التحقق المبدئي من وصول جميع البيانات
    if (!name || !phone || !email || !password) {
      res.status(400).json({
        success: false,
        message: "All fields are required (name, phone, email, password)",
      });
      return;
    }

    // 2. التحقق من عدم وجود مستخدم مسجل بنفس الإيميل أو رقم الهاتف
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "User with this email or phone already exists",
      });
      return;
    }

    // 3. تشفير كلمة المرور بواسطة bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. عملية الـ Create الفعلية في PostgreSQL عبر Prisma
    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        // role سيأخذ تلقائياً القيمة الافتراضية CUSTOMER
      },
      // select: تحديد الحقول المرجعة وتجنب إرجاع الـ password في Response
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // 5. إرجاع رسالة النجاح مع بيانات المستخدم المنشأ
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating user",
    });
  }
};