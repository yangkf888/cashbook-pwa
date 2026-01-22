import bcrypt from "bcryptjs";
import { PrismaClient, SpaceRole, SpaceType } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "password123";
const USERS = [
  { email: "alice@example.com", name: "Alice" },
  { email: "bob@example.com", name: "Bob" },
];

async function ensurePersonalSpace(userId: string, fallbackName: string) {
  const existingSpace = await prisma.space.findFirst({
    where: {
      type: SpaceType.personal,
      members: { some: { userId } },
    },
  });

  if (existingSpace) {
    await prisma.spaceMember.upsert({
      where: {
        spaceId_userId: {
          spaceId: existingSpace.id,
          userId,
        },
      },
      update: { role: SpaceRole.owner },
      create: {
        spaceId: existingSpace.id,
        userId,
        role: SpaceRole.owner,
      },
    });
    return existingSpace;
  }

  return prisma.space.create({
    data: {
      type: SpaceType.personal,
      name: `${fallbackName}的账本`,
      members: {
        create: {
          userId,
          role: SpaceRole.owner,
        },
      },
    },
  });
}

async function ensureFamilySpace(userIds: string[]) {
  const existingSpace = await prisma.space.findFirst({
    where: {
      type: SpaceType.family,
      name: "Family",
    },
  });

  const familySpace =
    existingSpace ??
    (await prisma.space.create({
      data: {
        type: SpaceType.family,
        name: "Family",
      },
    }));

  await Promise.all(
    userIds.map((userId) =>
      prisma.spaceMember.upsert({
        where: {
          spaceId_userId: {
            spaceId: familySpace.id,
            userId,
          },
        },
        update: { role: SpaceRole.member },
        create: {
          spaceId: familySpace.id,
          userId,
          role: SpaceRole.member,
        },
      })
    )
  );
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const userRecords = await Promise.all(
    USERS.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          passwordHash,
        },
        create: {
          email: user.email,
          name: user.name,
          passwordHash,
        },
      })
    )
  );

  await Promise.all(
    userRecords.map((user) => ensurePersonalSpace(user.id, user.name ?? "用户"))
  );

  await ensureFamilySpace(userRecords.map((user) => user.id));

  console.log("Seed completed: default users and spaces are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
