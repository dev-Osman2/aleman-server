import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

/**
 * Demo-only seed for the schema shared in the conversation.
 * - 1 admin + 29 demo customers
 * - A credential Account with a Better Auth-compatible password hash for each user
 * - One database Session row per seeded user
 *
 * IMPORTANT: the created Session rows are database records; this script does not
 * sign a browser cookie or log anyone into a browser. Users can sign in normally
 * with the credentials printed below, and Better Auth will issue its own cookie.
 */
const DEMO_SESSION_USER_AGENT = "aleman-backend-demo-seed";
const DEMO_CUSTOMER_PASSWORD = "Demo@12345";
const ADMIN_EMAIL = "contac@aswany.me";
const ADMIN_PHONE = "01080859921";
const ADMIN_PASSWORD = "Aswany@12345";
const SESSION_DAYS = 30;

const customers = Array.from({ length: 29 }, (_, index) => {
  const n = String(index + 1).padStart(2, "0");
  return {
    name: `عميل تجريبي ${n}`,
    email: `demo${n}@example.com`,
    
    phone: `000000000${String(index + 1).padStart(2, "0")}`,
    password: DEMO_CUSTOMER_PASSWORD,
    role: Role.CUSTOMER,
  };
});

const seedUsers = [
  {
    name: "Aswany",
    email: ADMIN_EMAIL,
    phone: ADMIN_PHONE,
    password: ADMIN_PASSWORD,
    role: Role.ADMIN,
  },
  ...customers,
];

async function upsertSeedUser(input: (typeof seedUsers)[number]) {
  const user = await prisma.user.upsert({
    where: { email: input.email },
    create: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      emailVerified: true,
      role: input.role,
    },
    update: {
      name: input.name,
      phone: input.phone,
      emailVerified: true,
      role: input.role,
    },
  });

  
  
  const passwordHash = await hashPassword(input.password);
  const credentialAccount = await prisma.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
    },
    select: { id: true },
  });

  if (credentialAccount) {
    await prisma.account.update({
      where: { id: credentialAccount.id },
      data: { password: passwordHash },
    });
  } else {
    await prisma.account.create({
      data: {
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    });
  }

  
  await prisma.session.deleteMany({
    where: { userId: user.id, userAgent: DEMO_SESSION_USER_AGENT },
  });

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
      ipAddress: "127.0.0.1",
      userAgent: DEMO_SESSION_USER_AGENT,
    },
  });

  return user;
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED_IN_PRODUCTION !== "true") {
    throw new Error(
      "Refusing to seed demo accounts in production. Run against a development database, or explicitly set ALLOW_DEMO_SEED_IN_PRODUCTION=true after checking DATABASE_URL.",
    );
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add it to your .env file first.");
  }

  console.log("Creating/updating 1 admin and 29 demo customers...");
  for (const input of seedUsers) {
    const user = await upsertSeedUser(input);
    console.log(`✓ ${user.role.padEnd(8)} ${user.email}`);
  }

  console.log("\nDemo seed completed.");
  console.log(`Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Customers: demo01@example.com ... demo29@example.com`);
  console.log(`Customer password: ${DEMO_CUSTOMER_PASSWORD}`);
  console.log(`A Session row expires in ${SESSION_DAYS} days for each seeded user.`);
  console.log("Note: sign in through Better Auth to receive the actual browser session cookie.");
}

main()
  .catch((error) => {
    console.error("Error seeding demo users:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
