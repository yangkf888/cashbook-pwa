import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

async function getMembership(spaceId: string, userId: string) {
  return prisma.spaceMember.findUnique({
    where: {
      spaceId_userId: {
        spaceId,
        userId
      }
    }
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { spaceId: string; txId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const membership = await getMembership(params.spaceId, session.user.id);
  if (!membership || membership.role === "viewer") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.txId }
  });

  if (!transaction || transaction.spaceId !== params.spaceId) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (
    membership.role === "member" &&
    transaction.createdByUserId !== session.user.id
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { type, amountCents, category, account, date, note } = body as {
    type: TransactionType;
    amountCents: number;
    category: string;
    account: string;
    date: string;
    note?: string | null;
  };

  if (
    !type ||
    typeof amountCents !== "number" ||
    amountCents <= 0 ||
    !category ||
    !account ||
    !date ||
    (type !== "income" && type !== "expense")
  ) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ message: "Invalid date" }, { status: 400 });
  }

  const updated = await prisma.transaction.update({
    where: { id: params.txId },
    data: {
      type,
      amountCents,
      category,
      account,
      date: parsedDate,
      note: note ?? null
    }
  });

  return NextResponse.json({
    transaction: {
      ...updated,
      date: updated.date.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    }
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { spaceId: string; txId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const membership = await getMembership(params.spaceId, session.user.id);
  if (!membership || membership.role === "viewer") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.txId }
  });

  if (!transaction || transaction.spaceId !== params.spaceId) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (
    membership.role === "member" &&
    transaction.createdByUserId !== session.user.id
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await prisma.transaction.delete({ where: { id: params.txId } });

  return NextResponse.json({ success: true });
}
