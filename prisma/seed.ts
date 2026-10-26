import { PrismaClient, Role, PaymentMethod, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning old database records...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users (Admin & Customer)...");
  const adminUser = await prisma.user.create({
    data: {
      name: "Aleman Store Admin",
      phone: "01000000001",
      email: "admin@aleman.store",
      password: "admin_password_123",
      role: Role.ADMIN,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      name: "Ahmed Mohamed Ali",
      phone: "01012345678",
      email: "ahmed@example.com",
      password: "user_password_123",
      role: Role.CUSTOMER,
    },
  });

  console.log("Seeding books inventory...");
  const books = await Promise.all([
    prisma.book.create({
      data: {
        code: 101,
        title: "The Sealed Nectar",
        description: "A complete authoritative book on the life of Prophet Muhammad.",
        fullDescription: "A detailed biography covering historical events with verified sources and comprehensive indexing.",
        price: 180,
        oldPrice: 210,
        quantity: 45,
        category: "Islamic Books",
        image: "/menuPicture/1.webp",
        author: "Safiur Rahman Mubarakpuri",
        publisher: "Darussalam",
        pagesCount: 512,
      },
    }),
    prisma.book.create({
      data: {
        code: 102,
        title: "Atomic Habits",
        description: "An easy and proven way to build good habits and break bad ones.",
        fullDescription: "James Clear presents a practical framework for improving every day through tiny changes that deliver remarkable results.",
        price: 150,
        oldPrice: 175,
        quantity: 30,
        category: "Self Development",
        image: "/menuPicture/2.webp",
        author: "James Clear",
        publisher: "Penguin Random House",
        pagesCount: 320,
      },
    }),
    prisma.book.create({
      data: {
        code: 103,
        title: "The Granada Trilogy",
        description: "A historical novel following an Andalusian family across generations.",
        fullDescription: "An epic literary work combining Granada, Maryama, and The Departure in a single complete volume.",
        price: 220,
        quantity: 20,
        category: "Novels",
        image: "/menuPicture/3.webp",
        author: "Radwa Ashour",
        publisher: "Dar Al-Shorouk",
        pagesCount: 490,
      },
    }),
    prisma.book.create({
      data: {
        code: 104,
        title: "Because You Are Allah",
        description: "Deep spiritual reflections on the meanings of Allah's Beautiful Names.",
        fullDescription: "A guide that brings the reader closer to understanding divine attributes and how to live by them daily.",
        price: 95,
        oldPrice: 120,
        quantity: 60,
        category: "Islamic Books",
        image: "/menuPicture/4.webp",
        author: "Ali Bin Jaber Al-Fifi",
        publisher: "Dar Al-Hadarah",
        pagesCount: 192,
      },
    }),
    prisma.book.create({
      data: {
        code: 105,
        title: "The Subtle Art of Not Giving a F*ck",
        description: "A counterintuitive approach to living a good life and focusing on what matters.",
        fullDescription: "Discusses how to focus limited human energy on things of true value instead of constant anxiety.",
        price: 140,
        quantity: 25,
        category: "Self Development",
        image: "/menuPicture/5.webp",
        author: "Mark Manson",
        publisher: "HarperOne",
        pagesCount: 272,
      },
    }),
    prisma.book.create({
      data: {
        code: 106,
        title: "Land of Zikola",
        description: "A fantasy thriller about a city that trades in intelligence units instead of money.",
        fullDescription: "Khaled enters an underground tunnel to find himself in Zikola, where currency is measured in human intelligence.",
        price: 110,
        oldPrice: 135,
        quantity: 40,
        category: "Novels",
        image: "/menuPicture/6.webp",
        author: "Amr Abdel Hamid",
        publisher: "Aseer Al-Kotob",
        pagesCount: 288,
      },
    }),
  ]);

  console.log("Seeding orders and order items...");
  const order1 = await prisma.order.create({
    data: {
      userId: customerUser.id,
      address: "Luxor - Television Street - Next to Al-Shifa Pharmacy - 3rd Floor",
      notes: "Please call 30 minutes before arrival",
      paymentMethod: PaymentMethod.INSTAPAY,
      transferNumber: "01012345678",
      subtotal: 330,
      deliveryFee: 20,
      total: 350,
      status: OrderStatus.CONFIRMED,
      items: {
        create: [
          {
            bookId: books[0].id,
            quantity: 1,
            priceAtBuy: 180,
          },
          {
            bookId: books[1].id,
            quantity: 1,
            priceAtBuy: 150,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: customerUser.id,
      address: "Luxor - Al-Awamiya - Behind Public Library",
      notes: "Wrap books as a gift if possible",
      paymentMethod: PaymentMethod.VODAFONE_CASH,
      transferNumber: "01098765432",
      subtotal: 410,
      deliveryFee: 20,
      total: 430,
      status: OrderStatus.PENDING,
      items: {
        create: [
          {
            bookId: books[2].id,
            quantity: 1,
            priceAtBuy: 220,
          },
          {
            bookId: books[3].id,
            quantity: 2,
            priceAtBuy: 95,
          },
        ],
      },
    },
  });

  console.log("Database seeded successfully:", {
    adminId: adminUser.id,
    customerId: customerUser.id,
    booksCount: books.length,
    orderIds: [order1.id, order2.id],
  });
}

main()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


  

































































































































































