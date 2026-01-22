import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice",
      passwordHash
    }
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob",
      passwordHash
    }
  });

  const familySpace = await prisma.space.create({
    data: {
      name: "家庭共享账本",
      type: "family",
      members: {
        create: [
          { userId: alice.id, role: "owner" },
          { userId: bob.id, role: "member" }
        ]
      }
    }
  });

  await prisma.space.create({
    data: {
      name: "我的账本",
      type: "personal",
      members: {
        create: [{ userId: alice.id, role: "owner" }]
      }
    }
  });

  console.log("Seed completed", { familySpaceId: familySpace.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
