import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSpaceSchema } from "@/lib/validation";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const memberships = await prisma.spaceMember.findMany({
    where: { userId: session.user.id },
    include: { space: true }
  });

  const spaces = memberships.map((membership) => ({
    id: membership.space.id,
    name: membership.space.name,
    type: membership.space.type,
    role: membership.role
  }));

  return NextResponse.json({ spaces });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSpaceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const space = await prisma.space.create({
    data: {
      type: "family",
      name: parsed.data.name,
      members: {
        create: {
          userId: session.user.id,
          role: "owner"
        }
      }
    }
  });

  return NextResponse.json(
    {
      id: space.id,
      name: space.name,
      type: space.type
    },
    { status: 201 }
  );
}
