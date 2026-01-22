import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedUsers = [
  {
    email: "alice@example.com",
    password: "password123",
    name: "Alice"
  },
  {
    email: "bob@example.com",
    password: "password123",
    name: "Bob"
  }
];

async function ensureSeedUser(email: string, password: string, name: string) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log(`Seed user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        name
      }
    });

    await tx.space.create({
      data: {
        type: "personal",
        name: "我的账本",
        members: {
          create: {
            userId: user.id,
            role: "owner"
          }
        }
      }
    });
  });

  console.log(`Seed user created: ${email}`);
}

async function main() {
  for (const user of seedUsers) {
    await ensureSeedUser(user.email, user.password, user.name);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
