import { Request, Response } from "express";
import { prisma } from "../prisma";
import {
  generateBooksExcel,
  parseBooksExcel,
} from "../services/excelService";
import { ApiError } from "../utils/apiError";

/**
 * تصدير جميع الكتب إلى ملف Excel (.xlsx)
 * GET /api/admin/books/export
 */
export const exportBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { code: "asc" },
    });

    const buffer = await generateBooksExcel(books);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="aleman-books.xlsx"'
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    res.status(200).send(buffer);
  } catch (error) {
    console.error("Error exporting books to Excel:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تصدير ملف الكتب",
    });
  }
};

/**
 * معاينة ملف Excel قبل الاستيراد وحساب الإحصائيات والأخطاء
 * POST /api/admin/books/import-preview
 */
export const previewBooksImport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file || !req.file.buffer) {
      res.status(400).json({
        success: false,
        message: "يرجى اختيار ملف Excel بصيغة .xlsx",
      });
      return;
    }

    const parseResult = await parseBooksExcel(req.file.buffer);

    // التحقق من حالة وجود الكتب في قاعدة البيانات لمعرفة الجديد والمحدث
    const validCodes = parseResult.validRows.map((r) => r.code);
    const existingBooks = await prisma.book.findMany({
      where: { code: { in: validCodes } },
      select: { code: true, title: true },
    });

    const existingCodesSet = new Set(existingBooks.map((b) => b.code));

    let newCount = 0;
    let updateCount = 0;

    parseResult.validRows.forEach((row) => {
      if (existingCodesSet.has(row.code)) {
        updateCount++;
      } else {
        newCount++;
      }
    });

    // عينة من البيانات الصالحة للمعاينة (أول 15 كتاب)
    const previewItems = parseResult.validRows.slice(0, 15).map((row) => ({
      code: row.code,
      title: row.title,
      author: row.author,
      price: row.price,
      oldPrice: row.oldPrice,
      quantity: row.quantity,
      category: row.category,
      action: existingCodesSet.has(row.code) ? "update" : "create",
    }));

    res.status(200).json({
      success: true,
      message: "تم فحص الملف بنجاح",
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        totalRows: parseResult.totalRows,
        validCount: parseResult.validRows.length,
        newCount,
        updateCount,
        invalidCount: parseResult.invalidRows.length,
        errors: parseResult.allErrors,
        previewItems,
      },
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Error previewing books import:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع أثناء فحص ملف الكتب",
    });
  }
};

/**
 * تنفيذ استيراد الكتب وتحديثها فعلياً داخل قاعدة البيانات
 * POST /api/admin/books/import
 */
export const importBooks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file || !req.file.buffer) {
      res.status(400).json({
        success: false,
        message: "يرجى إرفاق ملف Excel",
      });
      return;
    }

    const parseResult = await parseBooksExcel(req.file.buffer);

    if (parseResult.validRows.length === 0) {
      res.status(400).json({
        success: false,
        message: "لا توجد صفوف صالحة للاستيراد في هذا الملف. يرجى تصحيح الأخطاء أولاً.",
        errors: parseResult.allErrors,
      });
      return;
    }

    const validCodes = parseResult.validRows.map((r) => r.code);
    const existingBooks = await prisma.book.findMany({
      where: { code: { in: validCodes } },
      select: { code: true },
    });

    const existingCodesSet = new Set(existingBooks.map((b) => b.code));

    let createdCount = 0;
    let updatedCount = 0;

    // تنفيذ عمليات الـ Upsert داخل Transaction آمنة
    await prisma.$transaction(
      async (tx) => {
        for (const item of parseResult.validRows) {
          const isUpdate = existingCodesSet.has(item.code);

          await tx.book.upsert({
            where: { code: item.code },
            update: {
              title: item.title,
              description: item.description,
              fullDescription: item.fullDescription,
              price: item.price,
              oldPrice: item.oldPrice,
              pagesCount: item.pagesCount,
              publisher: item.publisher,
              quantity: item.quantity,
              category: item.category,
              image: item.image,
              author: item.author,
            },
            create: {
              code: item.code,
              title: item.title,
              description: item.description,
              fullDescription: item.fullDescription,
              price: item.price,
              oldPrice: item.oldPrice,
              pagesCount: item.pagesCount,
              publisher: item.publisher,
              quantity: item.quantity,
              category: item.category,
              image: item.image,
              author: item.author,
            },
          });

          if (isUpdate) {
            updatedCount++;
          } else {
            createdCount++;
          }
        }
      },
      {
        timeout: 60000, // مهلة 60 ثانية للملفات الكبيرة
      }
    );

    res.status(200).json({
      success: true,
      message: "تم استيراد وتحديث الكتب بنجاح",
      data: {
        totalProcessed: parseResult.totalRows,
        importedCount: parseResult.validRows.length,
        createdCount,
        updatedCount,
        invalidCount: parseResult.invalidRows.length,
        errors: parseResult.allErrors,
      },
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Error importing books from Excel:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء استيراد البيانات إلى قاعدة البيانات",
    });
  }
};

