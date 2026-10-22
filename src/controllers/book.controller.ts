import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. استخراج معاملات البحث والفلترة من Query String
    const { category, search } = req.query;

    // 2. بناء كائن الشروط ديناميكياً
    const whereConditions: Prisma.BookWhereInput = {};

    // فلترة القسم إذا تم تمريره ولم يكن "All"
    if (category && typeof category === "string" && category !== "All") {
      whereConditions.category = category;
    }

    // البحث النصي في العنوان أو المؤلف
    if (search && typeof search === "string" && search.trim() !== "") {
      const searchTerm = search.trim();
      whereConditions.OR = [
        {
          title: {
            contains: searchTerm,
            mode: "insensitive", // مدعوم في PostgreSQL للبحث غير الحساس للأحرف
          },
        },
        {
          author: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ];
    }

    // 3. تنفيذ الاستعلام مع الترتيب من الأحدث للأقدم
    const books = await prisma.book.findMany({
      where: whereConditions
    });

    // 4. إرجاع النتيجة
    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching books",
    });
  }
};