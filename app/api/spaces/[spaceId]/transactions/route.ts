import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { spaceId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.spaceMember.findUnique({
    where: {
      spaceId_userId: {
        spaceId: params.spaceId,
        userId: session.user.id
      }
    }
  });

  if (!membership) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) {
    const parsed = new Date(from);
    if (!Number.isNaN(parsed.getTime())) {
      dateFilter.gte = parsed;
    }
  }
  if (to) {
    const parsed = new Date(to);
    if (!Number.isNaN(parsed.getTime())) {
      dateFilter.lte = parsed;
    }
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      spaceId: params.spaceId,
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
      ...(type === "income" || type === "expense"
        ? { type: type as TransactionType }
        : {}),
      ...(q
        ? {
            OR: [
              { category: { contains: q, mode: "insensitive" } },
              { account: { contains: q, mode: "insensitive" } },
              { note: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { date: "desc" }
  });

  return NextResponse.json({
    transactions: transactions.map((transaction) => ({
      ...transaction,
      date: transaction.date.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString()
    }))
  });
}

export async function POST(
  request: Request,
  { params }: { params: { spaceId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.spaceMember.findUnique({
    where: {
      spaceId_userId: {
        spaceId: params.spaceId,
        userId: session.user.id
      }
    }
  });

  if (!membership || membership.role === "viewer") {
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

  const transaction = await prisma.transaction.create({
    data: {
      spaceId: params.spaceId,
      type,
      amountCents,
      category,
      account,
      date: parsedDate,
      note: note ?? null,
      createdByUserId: session.user.id
    }
  });

  return NextResponse.json(
    {
      transaction: {
        ...transaction,
        date: transaction.date.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString()
      }
    },
    { status: 201 }
  );
}
