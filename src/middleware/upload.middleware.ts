import multer from "multer";
import { Request } from "express";

const storage = multer.memoryStorage();

export const uploadExcelMiddleware = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // حد أقصى 15 ميجابايت
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const isXlsxExt = file.originalname.toLowerCase().endsWith(".xlsx");
    const validMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
      "application/zip",
      "application/x-zip-compressed",
    ];

    if (isXlsxExt || validMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مدعوم. يرجى رفع ملف Excel صالح بصيغة .xlsx فقط"));
    }
  },
});

