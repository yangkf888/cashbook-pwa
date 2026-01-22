import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "该邮箱已注册" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash
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

    return user;
  });

  return NextResponse.json(
    {
      id: createdUser.id,
      email: createdUser.email
    },
    { status: 201 }
  );
}
