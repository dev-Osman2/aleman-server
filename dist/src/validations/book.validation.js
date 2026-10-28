"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "حدث خطأ غير متوقع في الخادم";
    let errors = null;
    if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        message = "بيانات غير صالحة";
        errors = err.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
    }
    else if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            statusCode = 409;
            const target = err.meta?.target?.join(", ") || "حقل";
            message = `هذه القيمة مستخدمة بالفعل (${target})`;
        }
        else if (err.code === "P2025") {
            statusCode = 404;
            message = "العنصر المطلوب غير موجود في قاعدة البيانات";
        }
    }
    if (process.env.NODE_ENV !== "production") {
        console.error("💥 ERROR CAUGHT BY GLOBAL HANDLER:", err);
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors }),
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
};
exports.globalErrorHandler = globalErrorHandler;
