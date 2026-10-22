import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// إظهار استعلامات SQL الفعلية في التيرمينال أثناء التنفيذ
const prisma = new PrismaClient({
  log: ["query"],
});

async function learnPrisma() {
  console.log("\n======================================================= ");
  console.log("1. Filtering, Stock Check & Sorting");
  console.log("=======================================================");

  // جلب الكتب التي سعرها <= 150 ومخزونها متاح (أكبر من 0)
  const affordableInStockBooks = await prisma.book.findMany({
    where: {
      price: { lte: 150 },      // lte = Less Than or Equal
      quantity: { gt: 0 },     
    },
    orderBy: {
      price: "desc",
    },
    select: {
      code: true,
      title: true,
      price: true,
      quantity: true,
      category: true,
    },
  });

  console.log("Result (Affordable & In-Stock):", affordableInStockBooks);

  console.log("\n=======================================================");
  console.log("2. Relational Query (Eager Loading with Include)");
  console.log("=======================================================");

  // جلب الطلبات مع بيانات العميل والكتب المشتراة في استعلام موحد
  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          phone: true,
          email: true,
        },
      },
      items: {
        include: {
          book: {
            select: {
              code: true,
              title: true,
              price: true,
            },
          },
        },
      },
    },
  });

  console.log("Orders with User & Book Details:\n", JSON.stringify(orders, null, 2));

  console.log("\n=======================================================");
  console.log("3. Atomic Stock Decrement (Simulation)");
  console.log("=======================================================");

  // تجربة إنقاص مخزون أول كتاب في الداتابيز بمقدار 1
  const firstBook = await prisma.book.findFirst();

  if (firstBook) {
    const updatedBook = await prisma.book.update({
      where: { id: firstBook.id },
      data: {
        quantity: { decrement: 1 }, // ينقص المخزون مباشرة داخل PostgreSQL
      },
      select: {
        title: true,
        quantity: true,
      },
    });

    console.log(`Updated "${updatedBook.title}" remaining quantity:`, updatedBook.quantity);
  }
}

learnPrisma()
  .catch((error) => {
    console.error("Execution Error:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });