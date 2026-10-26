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


  // npx prisma db seed
// const books = [
//   {
//     code: 1001,
//     title: "مقدمة في الخوارزميات وهياكل البيانات",
//     description: "دليل تطبيقي شامل لفهم الخوارزميات الأساسية وحل المشكلات البرمجية بكفاءة.",
//     fullDescription: "يقدم هذا الكتاب شرحاً مفصلاً ومبسطاً لأهم هياكل البيانات مثل الأشجار والقوائم المترابطة، مع التركيز على تحليل التعقيد الزمني وتحسين الأداء.",
//     price: 180.0,
//     oldPrice: 220.0,
//     quantity: 15,
//     category: "تكنولوجيا وبرمجة",
//     image: "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=800&q=80",
//     author: "توماس كورمن",
//     publisher: "دار المعرفة التقنية",
//     pagesCount: 520,
//   },
//   {
//     code: 1002,
//     title: "فن اللامبالاة",
//     description: "دليل إرشادي لتجاوز التوقعات غير الواقعية والتركيز على ما يستحق الاهتمام فعلياً.",
//     fullDescription: "يستعرض مارك مانسون بأسلوب صريح وتجربة شخصية كيفية التعامل مع مصاعب الحياة وتحديد الأولويات الحقيقية دون الركض خلف الإيجابية الزائفة.",
//     price: 95.0,
//     oldPrice: 120.0,
//     quantity: 25,
//     category: "تطوير الذات",
//     image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
//     author: "مارك مانسون",
//     publisher: "منشورات الرمل",
//     pagesCount: 272,
//   },
//   {
//     code: 1003,
//     title: "كود نظيف: دليل صناعة البرمجيات الرشيقة",
//     description: "أفضل الممارسات الهندسية لكتابة شيفرة برمجية قابلة للقراءة والصيانة وإعادة الاستخدام.",
//     fullDescription: "مرجع كلاسيكي لمهندسي البرمجيات يوضح الفارق بين الكود الجيد والسيئ، مع إرشادات عملية حول تسمية المتغيرات وتصميم الدوال ومعالجة الأخطاء.",
//     price: 250.0,
//     oldPrice: 290.0,
//     quantity: 10,
//     category: "تكنولوجيا وبرمجة",
//     image: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&w=800&q=80",
//     author: "روبرت سي مارتن",
//     publisher: "دار الشروق الرقمية",
//     pagesCount: 464,
//   },
//   {
//     code: 1004,
//     title: "العادات الذرية",
//     description: "استراتيجيات عملية مثبتة لبناء عادات إيجابية مستمرة والتخلص من العادات السلبية.",
//     fullDescription: "يوضح جيمس كلير كيف يمكن لتغييرات صغيرة وبسيطة بنسبة 1% يومياً أن تؤدي إلى نتائج تراكمية مذهلة في مسار حياتك المهنية والشخصية.",
//     price: 110.0,
//     oldPrice: 140.0,
//     quantity: 30,
//     category: "تطوير الذات",
//     image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
//     author: "جيمس كلير",
//     publisher: "دار التنوير",
//     pagesCount: 320,
//   },
//   {
//     code: 1005,
//     title: "الأب الغني والأب الفقير",
//     description: "المفاهيم المالية الأساسية التي تصنع الفارق بين العقلية الاستثمارية والوظيفية.",
//     fullDescription: "يروي روبرت كيوساكي الفروق الجوهرية في إدارة المال والاستثمار والأصول بين والده الأكاديمي ووالد صديقه المستثمر العصامي.",
//     price: 85.0,
//     oldPrice: 105.0,
//     quantity: 18,
//     category: "إدارة وأعمال",
//     image: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&w=800&q=80",
//     author: "روبرت كيوساكي",
//     publisher: "مكتبة جرير",
//     pagesCount: 336,
//   },
//   {
//     code: 1006,
//     title: "قواعد العشق الأربعون",
//     description: "رواية صوفية فلسفية تسرد اللقاء الروحي التاريخي بين جلال الدين الرومي وشمس التبريزي.",
//     fullDescription: "تربط الرواية ببراعة بين رحلة إيلا في العصر الحديث مع رواية تقرؤها عن القرن الثالث عشر، مستعرضة معاني التسامح والمحبة والسلام الداخلي.",
//     price: 130.0,
//     oldPrice: 160.0,
//     quantity: 20,
//     category: "روايات وأدب",
//     image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
//     author: "إليف شافاق",
//     publisher: "دار الآداب",
//     pagesCount: 500,
//   },
//   {
//     code: 1007,
//     title: "تصميم التطبيقات كثيفة البيانات",
//     description: "المرجع الأساسي لتصميم وإدارة الأنظمة الموزعة وقواعد البيانات واسعة النطاق.",
//     fullDescription: "يغطي مارتن كليبمان المبادئ العميقة لتخزين البيانات، التوافق، التوسع الأفقي، التكرار، والتعامل مع حالات انقطاع الشبكة في البنى التحتية السحابية.",
//     price: 320.0,
//     oldPrice: 375.0,
//     quantity: 8,
//     category: "تكنولوجيا وبرمجة",
//     image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80",
//     author: "مارتن كليبمان",
//     publisher: "دار أورايلي العربية",
//     pagesCount: 616,
//   },
//   {
//     code: 1008,
//     title: "ثلاثية غرناطة",
//     description: "ملحمة روائية أندلسية ترصد مصائر عائلة واحدة في مرحلة ما بعد سقوط الحكم العربي.",
//     fullDescription: "تسرد رضوى عاشور تفاصيل الحياة الاجتماعية والنضال الإنساني لسكان غرناطة في مواجهة محاكم التفتيش وقرارات الطرد القسري حتى مطلع القرن السابع عشر.",
//     price: 150.0,
//     oldPrice: 180.0,
//     quantity: 14,
//     category: "روايات وأدب",
//     image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80",
//     author: "رضوى عاشور",
//     publisher: "دار الشروق",
//     pagesCount: 502,
//   },
//   {
//     code: 1009,
//     title: "التفكير بسرعة وببطء",
//     description: "تشريح معمق للتحيزات المعرفية وآليات اتخاذ القرار في العقل البشري.",
//     fullDescription: "يشرح عالم النفس الحائز على نوبل دانيال كانمان الفارق بين التفكير التلقائي البديهي والتفكير المنطقي المتأني وتأثير ذلك على خياراتنا الاقتصادية والشخصية.",
//     price: 165.0,
//     oldPrice: 195.0,
//     quantity: 12,
//     category: "علم نفس وفلسفة",
//     image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80",
//     author: "دانيال كانمان",
//     publisher: "مؤسسة هنداوي",
//     pagesCount: 590,
//   },
//   {
//     code: 1010,
//     title: "الإتقان",
//     description: "مسار تحويل الشغف والممارسة المركزة إلى براعة استثنائية ونبوغ في أي تخصص.",
//     fullDescription: "يستخلص روبرت غرين أنماط السلوك وخطوات التدريب التي اتبعها كبار المبدعين عبر التاريخ لتخطي مرحلة التلمذة والوصول إلى الهيمنة الفكرية والمهنية الكاملة.",
//     price: 140.0,
//     oldPrice: 170.0,
//     quantity: 16,
//     category: "تطوير الذات",
//     image: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80",
//     author: "روبرت غرين",
//     publisher: "دار التنوير",
//     pagesCount: 420,
//   },
// ];

// async function main() {
//   console.log("جارٍ إدخال مصفوفة الكتب...");

//   const result = await prisma.book.createMany({
//     data: books,
//     skipDuplicates: true, // يتجاهل الكتاب تلقائياً إذا كان كود الكتاب موجوداً مسبقاً
//   });

//   console.log(`تم إدخال ${result.count} كتاب بنجاح.`);
// }

// main()
//   .catch((e) => {
//     console.error("فشل تنفيذ الـ Seed:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });