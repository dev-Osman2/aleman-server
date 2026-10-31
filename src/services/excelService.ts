import ExcelJS from "exceljs";
import { Book } from "@prisma/client";
import { ApiError } from "../utils/apiError";

export interface ParsedBookRow {
  rowNumber: number;
  code: string;
  title: string;
  author: string | null;
  price: number;
  oldPrice: number | null;
  pagesCount: number | null;
  publisher: string | null;
  description: string;
  fullDescription: string | null;
  quantity: number;
  category: string;
  image: string;
}

export interface RowValidationError {
  row: number;
  code?: string;
  field: string;
  message: string;
}

export interface ExcelParseResult {
  totalRows: number;
  validRows: ParsedBookRow[];
  invalidRows: { rowNumber: number; errors: RowValidationError[] }[];
  allErrors: RowValidationError[];
}

/**
 * دالة مساعدة لاستخراج القيمة النصية أو الرقمية النظيفة من خلية Excel
 */
function getCellValue(cell: ExcelJS.Cell): any {
  const val = cell.value;
  if (val === null || val === undefined) return "";
  if (typeof val === "object") {
    if ("text" in val && typeof (val as any).text === "string") {
      return (val as any).text.trim();
    }
    if ("result" in val) {
      return (val as any).result;
    }
    if ("richText" in val && Array.isArray((val as any).richText)) {
      return (val as any).richText.map((t: any) => t.text).join("").trim();
    }
    if ("hyperlink" in val && "text" in val) {
      return (val as any).text || (val as any).hyperlink;
    }
  }
  if (typeof val === "string") return val.trim();
  return val;
}

/**
 * توليد ملف Excel يحتوي على جميع الكتب بالتنسيق الاحترافي
 */
export async function generateBooksExcel(books: Book[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "دار الإيمان";
  workbook.lastModifiedBy = "نظام إدارة دار الإيمان";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("قائمة الكتب", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1, rightToLeft: true }],
  });

  // تحديد الأعمدة وعروضها
  worksheet.columns = [
    { header: "Code", key: "code", width: 14 },
    { header: "Title", key: "title", width: 38 },
    { header: "Author", key: "author", width: 26 },
    { header: "Price", key: "price", width: 14 },
    { header: "OldPrice", key: "oldPrice", width: 14 },
    { header: "PageCount", key: "pagesCount", width: 14 },
    { header: "Publisher", key: "publisher", width: 26 },
    { header: "Desc", key: "description", width: 42 },
    { header: "FullDecs", key: "fullDescription", width: 42 },
    { header: "Quantity", key: "quantity", width: 14 },
    { header: "Category", key: "category", width: 22 },
    { header: "Image", key: "image", width: 32 },
  ];

  // تنسيق صف العناوين (Header)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF007A64" }, // اللون التيل الزمردي المميز لدار الإيمان
    };
    cell.font = {
      name: "Arial",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF005E4D" } },
      bottom: { style: "medium", color: { argb: "FF00473A" } },
      left: { style: "thin", color: { argb: "FF005E4D" } },
      right: { style: "thin", color: { argb: "FF005E4D" } },
    };
  });

  // إضافة صفوف الكتب وتنسيقها
  books.forEach((book, index) => {
    const row = worksheet.addRow({
      code: book.code,
      title: book.title,
      author: book.author || "",
      price: Number(book.price),
      oldPrice:
        book.oldPrice !== null && book.oldPrice !== undefined
          ? Number(book.oldPrice)
          : "",
      pagesCount:
        book.pagesCount !== null && book.pagesCount !== undefined
          ? Number(book.pagesCount)
          : "",
      publisher: book.publisher || "",
      description: book.description || "",
      fullDescription: book.fullDescription || "",
      quantity: Number(book.quantity) || 0,
      category: book.category || "",
      image: book.image || "",
    });

    row.height = 24;

    const isEven = index % 2 === 0;
    const bgArgb = isEven ? "FFFFFFFF" : "FFF9FAFB"; // تظليل تبادلي خفيف جداً

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgArgb },
      };
      cell.font = {
        name: "Arial",
        size: 10,
        color: { argb: "FF1F2937" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };

      // تنسيقات محددة حسب العمود
      switch (colNumber) {
        case 1: // Code
          cell.alignment = { vertical: "middle", horizontal: "center" };
          break;
        case 2: // Title
          cell.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
          break;
        case 3: // Author
          cell.alignment = { vertical: "middle", horizontal: "right" };
          break;
        case 4: // Price
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.numFmt = "#,##0";
          break;
        case 5: // OldPrice
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.numFmt = "#,##0";
          break;
        case 6: // PageCount
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.numFmt = "#,##0";
          break;
        case 7: // Publisher
          cell.alignment = { vertical: "middle", horizontal: "right" };
          break;
        case 8: // Desc
          cell.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
          break;
        case 9: // FullDecs
          cell.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
          break;
        case 10: // Quantity
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.numFmt = "#,##0";
          break;
        case 11: // Category
          cell.alignment = { vertical: "middle", horizontal: "center" };
          break;
        case 12: // Image
          cell.alignment = { vertical: "middle", horizontal: "left" };
          break;
      }
    });
  });

  // تفعيل التصفية التلقائية (Auto Filter) على كافة الأعمدة
  worksheet.autoFilter = { from: "A1", to: "L1" };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * قراءة ملف Excel والتحقق من صحة الأعمدة والبيانات والصفوف
 */
export async function parseBooksExcel(fileBuffer: Buffer): Promise<ExcelParseResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(fileBuffer as any);
  } catch (err: any) {
    throw new ApiError(400, "تعذر قراءة ملف Excel، يرجى التأكد من أن الملف بصيغة .xlsx صالحة وغير تالف");
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount < 2) {
    throw new ApiError(400, "ملف Excel فارغ أو لا يحتوي على صفوف بيانات للكتب");
  }

  // 1. قراءة صف العناوين وتعيين مؤشرات الأعمدة
  const headerMap = new Map<string, number>();
  const headerRow = worksheet.getRow(1);

  headerRow.eachCell((cell, colNumber) => {
    const val = String(getCellValue(cell) || "")
      .toLowerCase()
      .replace(/[\s_-]/g, "");
    if (val) {
      headerMap.set(val, colNumber);
    }
  });

  const getColIndex = (...aliases: string[]): number | undefined => {
    for (const alias of aliases) {
      const clean = alias.toLowerCase().replace(/[\s_-]/g, "");
      if (headerMap.has(clean)) {
        return headerMap.get(clean);
      }
    }
    return undefined;
  };

  const colCode = getColIndex("code", "كود", "الكود", "رقم_الكتاب");
  const colTitle = getColIndex("title", "عنوان", "العنوان", "اسم_الكتاب");
  const colAuthor = getColIndex("author", "المؤلف", "الكاتب");
  const colPrice = getColIndex("price", "السعر", "سعر_البيع");
  const colOldPrice = getColIndex("oldprice", "السعر_القديم", "السعر_قبل_الخصم");
  const colPageCount = getColIndex("pagecount", "pagescount", "عدد_الصفحات", "الصفحات");
  const colPublisher = getColIndex("publisher", "الناشر", "دار_النشر");
  const colDesc = getColIndex("desc", "description", "الوصف", "نبذة");
  const colFullDecs = getColIndex("fulldecs", "fulldesc", "fulldescription", "الوصف_الكامل");
  const colQuantity = getColIndex("quantity", "الكمية", "المخزون");
  const colCategory = getColIndex("category", "القسم", "التصنيف");
  const colImage = getColIndex("image", "الصورة", "رابط_الصورة");

  // التحقق من وجود الأعمدة الإلزامية الأساسية
  const missingHeaders: string[] = [];
  if (!colCode) missingHeaders.push("Code");
  if (!colTitle) missingHeaders.push("Title");
  if (!colPrice) missingHeaders.push("Price");
  if (!colCategory) missingHeaders.push("Category");
  if (!colImage) missingHeaders.push("Image");

  if (missingHeaders.length > 0) {
    throw new ApiError(
      400,
      `أعمدة إلزامية مفقودة في ملف Excel: [${missingHeaders.join(", ")}]. يرجى التأكد من مطابقة القالب المطلوب.`
    );
  }

  const validRows: ParsedBookRow[] = [];
  const invalidRows: { rowNumber: number; errors: RowValidationError[] }[] = [];
  const allErrors: RowValidationError[] = [];
  const seenCodesInFile = new Map<string, number>();

  let totalProcessedRows = 0;

  // 2. قراءة الصفوف وفحصها صفاً بصف
  for (let r = 2; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);

    // فحص ما إذا كان الصف فارغاً بالكامل
    let isRowEmpty = true;
    row.eachCell((cell) => {
      if (getCellValue(cell) !== "") isRowEmpty = false;
    });

    if (isRowEmpty) continue;

    totalProcessedRows++;
    const rowErrors: RowValidationError[] = [];

    // استخراج القيم
    const rawCode = colCode ? getCellValue(row.getCell(colCode)) : "";
    const rawTitle = colTitle ? getCellValue(row.getCell(colTitle)) : "";
    const rawAuthor = colAuthor ? getCellValue(row.getCell(colAuthor)) : "";
    const rawPrice = colPrice ? getCellValue(row.getCell(colPrice)) : "";
    const rawOldPrice = colOldPrice ? getCellValue(row.getCell(colOldPrice)) : "";
    const rawPageCount = colPageCount ? getCellValue(row.getCell(colPageCount)) : "";
    const rawPublisher = colPublisher ? getCellValue(row.getCell(colPublisher)) : "";
    const rawDesc = colDesc ? getCellValue(row.getCell(colDesc)) : "";
    const rawFullDecs = colFullDecs ? getCellValue(row.getCell(colFullDecs)) : "";
    const rawQuantity = colQuantity ? getCellValue(row.getCell(colQuantity)) : "";
    const rawCategory = colCategory ? getCellValue(row.getCell(colCategory)) : "";
    const rawImage = colImage ? getCellValue(row.getCell(colImage)) : "";

    // التحقق من Code
    let codeStr = "";
    if (rawCode === "" || rawCode === null || rawCode === undefined) {
      rowErrors.push({
        row: r,
        field: "Code",
        message: "كود الكتاب (Code) مفقود",
      });
    } else {
      codeStr = String(rawCode).trim();
      // التأكد من أن الكود يحتوي على أرقام فقط
      if (!/^\d+$/.test(codeStr)) {
        rowErrors.push({
          row: r,
          code: codeStr,
          field: "Code",
          message: `كود الكتاب غير صالح: "${codeStr}" (يجب أن يكون رقماً صحيحاً)`,
        });
      } else if (seenCodesInFile.has(codeStr)) {
        const previousRow = seenCodesInFile.get(codeStr);
        rowErrors.push({
          row: r,
          code: codeStr,
          field: "Code",
          message: `الكود مكرر داخل نفس الملف في السطر ${previousRow} والسطر ${r}`,
        });
      } else {
        seenCodesInFile.set(codeStr, r);
      }
    }

    // التحقق من Title
    const titleStr = String(rawTitle || "").trim();
    if (!titleStr) {
      rowErrors.push({
        row: r,
        code: codeStr,
        field: "Title",
        message: "عنوان الكتاب (Title) مطلوب ولا يمكن أن يكون فارغاً",
      });
    }

    // التحقق من Price
    let priceNum = NaN;
    if (rawPrice === "" || rawPrice === null || rawPrice === undefined) {
      rowErrors.push({
        row: r,
        code: codeStr,
        field: "Price",
        message: "سعر الكتاب (Price) مطلوب",
      });
    } else {
      priceNum = Number(rawPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        rowErrors.push({
          row: r,
          code: codeStr,
          field: "Price",
          message: `سعر الكتاب غير صالح: "${rawPrice}" (يجب أن يكون رقماً أكبر من الصفر)`,
        });
      }
    }

    // التحقق من OldPrice
    let oldPriceNum: number | null = null;
    if (rawOldPrice !== "" && rawOldPrice !== null && rawOldPrice !== undefined) {
      const parsedOldPrice = Number(rawOldPrice);
      if (isNaN(parsedOldPrice) || parsedOldPrice < 0) {
        rowErrors.push({
          row: r,
          code: codeStr,
          field: "OldPrice",
          message: `السعر القديم غير صالح: "${rawOldPrice}" (يجب أن يكون رقماً)`,
        });
      } else {
        oldPriceNum = Math.round(parsedOldPrice);
      }
    }

    // التحقق من Category
    const categoryStr = String(rawCategory || "").trim();
    if (!categoryStr) {
      rowErrors.push({
        row: r,
        code: codeStr,
        field: "Category",
        message: "قسم الكتاب (Category) مطلوب",
      });
    }

    // التحقق من Image
    const imageStr = String(rawImage || "").trim();
    if (!imageStr) {
      rowErrors.push({
        row: r,
        code: codeStr,
        field: "Image",
        message: "رابط صورة الكتاب (Image) مطلوب",
      });
    }

    // التحقق من Quantity
    let quantityNum = 0;
    if (rawQuantity !== "" && rawQuantity !== null && rawQuantity !== undefined) {
      const parsedQty = Number(rawQuantity);
      if (isNaN(parsedQty) || parsedQty < 0 || !Number.isInteger(parsedQty)) {
        rowErrors.push({
          row: r,
          code: codeStr,
          field: "Quantity",
          message: `الكمية غير صالحة: "${rawQuantity}" (يجب أن تكون رقماً صحيحاً صفر أو أكبر)`,
        });
      } else {
        quantityNum = parsedQty;
      }
    }

    // التحقق من PageCount
    let pageCountNum: number | null = null;
    if (rawPageCount !== "" && rawPageCount !== null && rawPageCount !== undefined) {
      const parsedPages = Number(rawPageCount);
      if (isNaN(parsedPages) || parsedPages <= 0 || !Number.isInteger(parsedPages)) {
        rowErrors.push({
          row: r,
          code: codeStr,
          field: "PageCount",
          message: `عدد الصفحات غير صالح: "${rawPageCount}" (يجب أن يكون رقماً صحيحاً موجباً)`,
        });
      } else {
        pageCountNum = parsedPages;
      }
    }

    // تجهيز الوصف
    const descStr = String(rawDesc || "").trim() || titleStr;
    const fullDescStr = String(rawFullDecs || "").trim() || null;
    const authorStr = String(rawAuthor || "").trim() || null;
    const publisherStr = String(rawPublisher || "").trim() || null;

    if (rowErrors.length > 0) {
      invalidRows.push({ rowNumber: r, errors: rowErrors });
      allErrors.push(...rowErrors);
    } else {
      validRows.push({
        rowNumber: r,
        code: codeStr,
        title: titleStr,
        author: authorStr,
        price: Math.round(priceNum),
        oldPrice: oldPriceNum,
        pagesCount: pageCountNum,
        publisher: publisherStr,
        description: descStr,
        fullDescription: fullDescStr,
        quantity: quantityNum,
        category: categoryStr,
        image: imageStr,
      });
    }
  }

  return {
    totalRows: totalProcessedRows,
    validRows,
    invalidRows,
    allErrors,
  };
}
